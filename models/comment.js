"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User, Blog }) {
      this.belongsTo(User, { foreignKey: "userId" });
      this.belongsTo(Blog, { foreignKey: "blogId" });
    }
  }
  Comment.init(
    {
      content: DataTypes.TEXT,
      date: DataTypes.DATE,
      userId: DataTypes.INTEGER,
      blogId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Comment",
      tableName: "comments",
      freezeTableName: true,
    },
  );
  return Comment;
};
