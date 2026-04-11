'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Blog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User, Comment, Like }) {
      this.belongsTo(User, { foreignKey: "userId" });
      this.hasMany(Comment, { foreignKey: "blogId", onDelete: "CASCADE" });
      this.hasMany(Like, { foreignKey: "blogId", onDelete: "CASCADE" });
    }
  }
  Blog.init({
    title: DataTypes.STRING,
    slug: DataTypes.STRING,
    excerpt: DataTypes.TEXT,
    content: DataTypes.TEXT,
    category: DataTypes.STRING,
    categorySlug: DataTypes.STRING,
    coverImage: DataTypes.STRING,
    author: DataTypes.STRING,
    readTime: DataTypes.STRING,
    date: DataTypes.DATE,
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Blog',
  });
  return Blog;
};
