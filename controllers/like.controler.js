const express = require("express");
const { Like, Blog } = require("../models");
const { AuthMiddleware } = require("../middleware");
const { ServerException, NotFoundException } = require("../exceptions");

class LikeController {
    _path = "/likes";
    _router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    async toggle(req, res, next) {
        try {
            const blogId = req.params.blogId;
            const userId = req.user.id;

            const blog = await Blog.findByPk(blogId, {
                include: [{ model: Like }]
            });

            if (!blog) return next(new NotFoundException("Blog not found"));

            const existingLike = await Like.findOne({ where: { blogId, userId } });

            if (existingLike) {
                // remove like
                await existingLike.destroy();

                // updated likes count
                const updatedCount = await Like.count({ where: { blogId } });

                return res.json({
                    status: 200,
                    liked: false,
                    likesCount: updatedCount,
                    message: "Unliked"
                });
            }

            // add like
            await Like.create({ blogId, userId });

            const updatedCount = await Like.count({ where: { blogId } });

            return res.json({
                status: 200,
                liked: true,
                likesCount: updatedCount,
                message: "Liked"
            });

        } catch (error) {
            next(new ServerException(error.message));
        }
    }


    initializeRoutes() {
        this._router.post(`${this._path}/:blogId/toggle`, AuthMiddleware, this.toggle.bind(this));
    }
}

module.exports = LikeController;
