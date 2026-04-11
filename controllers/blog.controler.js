const express = require("express");
const { Blog, User, Comment, Like, Hashtag, sequelize } = require("../models");
const { AuthMiddleware } = require("../middleware");
const OptionalAuthMiddleware = require("../middleware/optional-auth.middleware");
const MulterMiddleware = require("../middleware/multer.middleware");
const { ServerException, NotFoundException, ForbiddenException } = require("../exceptions");
const { Op, Sequelize } = require("sequelize");
const { calculateReadTime } = require("../utils");

const escapeLikeTerm = (value = "") => value.replace(/[%_\\]/g, "\\$&");
const stripHtmlTags = (value = "") => String(value).replace(/<[^>]*>/g, " ");
const makeSlug = (value = "", fallback = "item") =>
    String(value || fallback)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || fallback;

const extractHashtags = (value = "") => {
    const text = stripHtmlTags(value);
    const matches = text.match(/(?:^|\s)#([A-Za-z0-9_]+)/g) || [];
    return [
        ...new Set(
            matches
                .map((item) => item.replace(/\s/g, "").replace(/^#/, "").toLowerCase())
                .filter(Boolean)
        ),
    ];
};

class BlogController {
    _path = "/blogs";
    _router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    async buildUniqueBlogSlug(title = "", excludeId = null, transaction = null) {
        const base = makeSlug(title, "blog");
        const possibleMatches = await Blog.findAll({
            where: {
                slug: {
                    [Op.like]: `${base}%`
                },
                ...(excludeId ? { id: { [Op.ne]: excludeId } } : {})
            },
            attributes: ["slug"],
            transaction
        });

        const existing = new Set(possibleMatches.map((item) => item.slug));
        if (!existing.has(base)) return base;

        let suffix = 1;
        let next = `${base}-${suffix}`;
        while (existing.has(next)) {
            suffix += 1;
            next = `${base}-${suffix}`;
        }
        return next;
    }

    async findBlogByIdentifier(identifier, options = {}) {
        const where = /^\d+$/.test(String(identifier))
            ? { [Op.or]: [{ id: Number(identifier) }, { slug: String(identifier) }] }
            : { slug: String(identifier) };
        return Blog.findOne({ where, ...options });
    }

    async syncHashtagCounts(previousTags = [], nextTags = [], transaction) {
        const previousSet = new Set(previousTags);
        const nextSet = new Set(nextTags);

        const toIncrement = [...nextSet].filter((tag) => !previousSet.has(tag));
        const toDecrement = [...previousSet].filter((tag) => !nextSet.has(tag));

        await Promise.all(
            toIncrement.map(async (tag) => {
                const [record, created] = await Hashtag.findOrCreate({
                    where: { name: tag },
                    defaults: { name: tag, count: 1 },
                    transaction,
                });

                if (!created) {
                    await record.increment("count", { by: 1, transaction });
                }
            })
        );

        await Promise.all(
            toDecrement.map(async (tag) => {
                const record = await Hashtag.findOne({ where: { name: tag }, transaction });
                if (!record) return;

                const nextCount = Math.max(0, (record.count || 0) - 1);
                if (nextCount === 0) {
                    await record.destroy({ transaction });
                    return;
                }
                await record.update({ count: nextCount }, { transaction });
            })
        );
    }

    async getAll(req, res, next) {
        try {
            let { page = 1, limit = 3, search = "", categorySlug = "", category = "" } = req.query;

            page = parseInt(page);
            limit = parseInt(limit);
            const offset = (page - 1) * limit;

            // Sanitize search term - escape special characters for SQL LIKE
            const searchTerm = search.trim();
            const sanitizedSearch = searchTerm.replace(/[%_\\]/g, '\\$&'); // Escape SQL wildcards

            // Build search conditions
            const andConditions = [];

            if (sanitizedSearch !== "") {
                // Search in blog fields: title, excerpt, content, category, author
                // Also search in user names using a subquery
                andConditions.push({
                    [Op.or]: [
                        // Blog fields
                        { title: { [Op.like]: `%${sanitizedSearch}%` } },
                        { excerpt: { [Op.like]: `%${sanitizedSearch}%` } },
                        { content: { [Op.like]: `%${sanitizedSearch}%` } },
                        { category: { [Op.like]: `%${sanitizedSearch}%` } },
                        { author: { [Op.like]: `%${sanitizedSearch}%` } },
                        // User name search using Sequelize literal for subquery
                        // Works with both MySQL and PostgreSQL (case-insensitive)
                        Sequelize.literal(`EXISTS (
                            SELECT 1 FROM Users 
                            WHERE Users.id = Blog.userId 
                            AND LOWER(Users.name) LIKE LOWER('%${sanitizedSearch.replace(/'/g, "''")}%')
                        )`)
                    ]
                });
            }

            const normalizedCategorySlug = String(categorySlug || "").trim().toLowerCase();
            if (normalizedCategorySlug) {
                andConditions.push(
                    Sequelize.where(
                        Sequelize.fn("LOWER", Sequelize.col("Blog.categorySlug")),
                        normalizedCategorySlug
                    )
                );
            } else if (String(category || "").trim()) {
                andConditions.push(
                    Sequelize.where(
                        Sequelize.fn("LOWER", Sequelize.col("Blog.category")),
                        String(category).trim().toLowerCase()
                    )
                );
            }

            const whereCondition = andConditions.length > 0 ? { [Op.and]: andConditions } : {};

            // Build include array
            const includes = [
                {
                    model: User,
                    attributes: ["id", "name", "email"],
                    required: false // LEFT JOIN - don't block results
                },
                {
                    model: Comment,
                    include: [{ model: User, attributes: ["id", "name"] }],
                    required: false
                },
                {
                    model: Like,
                    required: false
                }
            ];

            // Count total blogs matching search (including user name search)
            const totalBlogs = await Blog.count({
                where: whereCondition,
                distinct: true,
                col: 'Blog.id'
            });

            // Fetch blogs with pagination and search
            const blogs = await Blog.findAll({
                where: whereCondition,
                include: includes,
                order: [["createdAt", "DESC"]],
                limit,
                offset,
                distinct: true, // Important for accurate pagination with includes
                logging: false
            });

            const userId = req.user?.id || null;

            const result = blogs.map(blog => {
                const blogData = blog.toJSON();
                const isLiked = userId ? (blog.Likes || []).some(like => like.userId === userId) : false;
                return {
                    ...blogData,
                    likesCount: (blog.Likes || []).length,
                    isLiked
                };
            });

            res.json({
                status: 200,
                message: "success",
                blogs: result,
                pagination: {
                    total: totalBlogs,
                    page,
                    limit,
                    totalPages: Math.ceil(totalBlogs / limit)
                }
            });

        } catch (error) {
            next(new ServerException(error.message));
        }
    }


    async getOne(req, res, next) {
        try {
            const blog = await this.findBlogByIdentifier(req.params.slug, {
                include: [
                    { model: User, attributes: ["id", "name", "email"] },
                    { model: Comment, include: [{ model: User, attributes: ["id", "name"] }] },
                    { model: Like }
                ]
            });

            if (!blog) return next(new NotFoundException("Blog not found"));

            const userId = req.user?.id || null;
            const isLiked = userId ? blog.Likes.some(like => like.userId === userId) : false;
            const result = {
                ...blog.toJSON(),
                likesCount: blog.Likes.length,
                isLiked
            };

            res.json({ status: 200, message: "success", blog: result });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    async create(req, res, next) {
        try {
            const { author, title, excerpt, content, category } = req.body;
            const userId = req.user.id;
            const hashtags = extractHashtags(`${title || ""} ${excerpt || ""} ${content || ""}`);
            const coverImage = req.file ? `${MulterMiddleware.baseFilePath}${req.file.filename}` : null;

            const blog = await sequelize.transaction(async (transaction) => {
                const slug = await this.buildUniqueBlogSlug(title, null, transaction);
                const createdBlog = await Blog.create({
                    author,
                    title,
                    slug,
                    excerpt,
                    content,
                    category,
                    categorySlug: makeSlug(category, "general"),
                    coverImage,
                    readTime: calculateReadTime(content),
                    userId
                }, { transaction });

                await this.syncHashtagCounts([], hashtags, transaction);
                return createdBlog;
            });

            res.json({ status: 201, message: "Blog created", blog: blog });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    async update(req, res, next) {
        try {
            const blog = await this.findBlogByIdentifier(req.params.slug);
            if (!blog) return next(new NotFoundException("Blog not found"));
            if (blog.userId !== req.user.id) return next(new ForbiddenException("Not allowed"));

            const { title, excerpt, content, category } = req.body;
            const previousTags = extractHashtags(`${blog.title || ""} ${blog.excerpt || ""} ${blog.content || ""}`);
            const nextTags = extractHashtags(`${title || ""} ${excerpt || ""} ${content || ""}`);
            const coverImage = req.file
                ? `${MulterMiddleware.baseFilePath}${req.file.filename}`
                : blog.coverImage;

            await sequelize.transaction(async (transaction) => {
                const nextSlug = await this.buildUniqueBlogSlug(title, blog.id, transaction);
                await blog.update({
                    title,
                    slug: nextSlug,
                    excerpt,
                    content,
                    category,
                    categorySlug: makeSlug(category, "general"),
                    coverImage,
                    readTime: calculateReadTime(content)
                }, { transaction });
                await this.syncHashtagCounts(previousTags, nextTags, transaction);
            });

            res.json({ status: 200, message: "Blog updated", data: blog });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    async delete(req, res, next) {
        try {
            const blog = await this.findBlogByIdentifier(req.params.slug);
            if (!blog) return next(new NotFoundException("Blog not found"));
            if (blog.userId !== req.user.id) return next(new ForbiddenException("Not allowed"));
            const tags = extractHashtags(`${blog.title || ""} ${blog.excerpt || ""} ${blog.content || ""}`);

            await sequelize.transaction(async (transaction) => {
                await this.syncHashtagCounts(tags, [], transaction);
                await blog.destroy({ transaction });
            });
            res.json({ status: 200, message: "Blog deleted" });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    async getHashtagSuggestions(req, res, next) {
        try {
            const rawQuery = String(req.query.q || "").trim().toLowerCase();
            const sanitized = escapeLikeTerm(rawQuery);

            const where = sanitized
                ? {
                    name: { [Op.like]: `%${sanitized}%` }
                }
                : {};

            const tags = await Hashtag.findAll({
                where,
                attributes: ["name", "count"],
                order: [["count", "DESC"], ["name", "ASC"]],
                limit: 10
            });

            res.json(tags.map((item) => item.toJSON()));
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    async getBlogsByHashtag(req, res, next) {
        try {
            const rawTag = String(req.params.tag || "").trim().toLowerCase();
            const safeTag = rawTag.replace(/[^\w]/g, "");
            if (!safeTag) {
                return res.json({ status: 200, message: "success", blogs: [] });
            }

            const searchPattern = `%#${escapeLikeTerm(safeTag)}%`;
            const blogs = await Blog.findAll({
                where: {
                    [Op.or]: [
                        Sequelize.where(
                            Sequelize.fn("LOWER", Sequelize.col("Blog.content")),
                            { [Op.like]: searchPattern }
                        ),
                        Sequelize.where(
                            Sequelize.fn("LOWER", Sequelize.col("Blog.excerpt")),
                            { [Op.like]: searchPattern }
                        ),
                        Sequelize.where(
                            Sequelize.fn("LOWER", Sequelize.col("Blog.title")),
                            { [Op.like]: searchPattern }
                        ),
                    ],
                },
                include: [
                    { model: User, attributes: ["id", "name", "email"], required: false },
                    { model: Comment, include: [{ model: User, attributes: ["id", "name"] }], required: false },
                    { model: Like, required: false }
                ],
                order: [["createdAt", "DESC"]],
                limit: 50
            });

            const userId = req.user?.id || null;
            const result = blogs.map((blog) => {
                const data = blog.toJSON();
                const isLiked = userId ? (blog.Likes || []).some((like) => like.userId === userId) : false;
                return {
                    ...data,
                    likesCount: (blog.Likes || []).length,
                    isLiked
                };
            });

            res.json({ status: 200, message: "success", blogs: result });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    async getCategories(req, res, next) {
        try {
            const rawLimit = parseInt(req.query.limit, 10);
            const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : null;

            const rows = await Blog.findAll({
                attributes: [
                    "category",
                    "categorySlug",
                    [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]
                ],
                where: {
                    category: { [Op.ne]: null }
                },
                group: ["category", "categorySlug"],
                order: [[Sequelize.fn("COUNT", Sequelize.col("id")), "DESC"], ["category", "ASC"]],
                ...(limit ? { limit } : {})
            });

            const categories = rows
                .map((row) => {
                    const data = row.toJSON();
                    const name = String(data.category || "").trim();
                    const slug = String(data.categorySlug || makeSlug(name, "general")).trim();
                    const count = Number(data.count || 0);

                    return { name, slug, count };
                })
                .filter((item) => item.name);

            res.json({ status: 200, message: "success", categories });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    initializeRoutes() {
        // Make getAll and getOne optionally authenticated (middleware runs but doesn't require auth)
        this._router.get("/categories", OptionalAuthMiddleware, this.getCategories.bind(this));
        this._router.get("/hashtags", this.getHashtagSuggestions.bind(this));
        this._router.get("/hashtags/:tag/blogs", OptionalAuthMiddleware, this.getBlogsByHashtag.bind(this));
        this._router.get(`${this._path}`, OptionalAuthMiddleware, this.getAll.bind(this));
        this._router.get(`${this._path}/:slug`, OptionalAuthMiddleware, this.getOne.bind(this));
        this._router.post(`${this._path}`, AuthMiddleware, MulterMiddleware.upload.single("coverImage"), this.create.bind(this));
        this._router.put(`${this._path}/:slug`, AuthMiddleware, MulterMiddleware.upload.single("coverImage"), this.update.bind(this));
        this._router.delete(`${this._path}/:slug`, AuthMiddleware, this.delete.bind(this));
    }
}

module.exports = BlogController;
