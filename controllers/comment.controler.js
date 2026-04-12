const express = require("express");
const { Comment, User, Blog, Hashtag, sequelize } = require("../models");
const { AuthMiddleware, VerifiedMiddleware } = require("../middleware");
const { ServerException, NotFoundException, ForbiddenException } = require("../exceptions");

const extractHashtags = (value = "") => {
    const text = String(value || "").replace(/<[^>]*>/g, " ");
    const matches = text.match(/(?:^|\s)#([A-Za-z0-9_]+)/g) || [];
    return [
        ...new Set(
            matches
                .map((item) => item.replace(/\s/g, "").replace(/^#/, "").toLowerCase())
                .filter(Boolean)
        ),
    ];
};

const incrementHashtagCounts = async (tags = [], transaction) => {
    await Promise.all(
        tags.map(async (tag) => {
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
};

const decrementHashtagCounts = async (tags = [], transaction) => {
    await Promise.all(
        tags.map(async (tag) => {
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
};

class CommentController {
    _path = "/comments";
    _router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    async create(req, res, next) {
        try {
            const { content } = req.body;
            const userId = req.user.id;
            const blogId = req.params.blogId;

            const blog = await Blog.findByPk(blogId);
            if (!blog) return next(new NotFoundException("Blog not found"));

            const tags = extractHashtags(content);
            const comment = await sequelize.transaction(async (transaction) => {
                const created = await Comment.create({ content, userId, blogId, date: new Date() }, { transaction });
                await incrementHashtagCounts(tags, transaction);
                return created;
            });

            const fullComment = await Comment.findByPk(comment.id, {
                include: [{ model: User, attributes: ["id", "name"] }]
            });

            res.json({ status: 201, message: "Comment created", comment: fullComment });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    async delete(req, res, next) {
        try {
            const comment = await Comment.findByPk(req.params.id);
            if (!comment) return next(new NotFoundException("Comment not found"));
            if (comment.userId !== req.user.id) return next(new ForbiddenException("Not allowed"));
            const tags = extractHashtags(comment.content);
            await sequelize.transaction(async (transaction) => {
                await decrementHashtagCounts(tags, transaction);
                await comment.destroy({ transaction });
            });
            res.json({ status: 200, message: "Comment deleted" });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    initializeRoutes() {
        this._router.post(`${this._path}/:blogId`, AuthMiddleware, VerifiedMiddleware, this.create.bind(this));
        this._router.delete(`${this._path}/:id`, AuthMiddleware, this.delete.bind(this));
    }
}

module.exports = CommentController;
