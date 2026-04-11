"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate({ Blog, Comment, Like }) {
      this.hasMany(Blog, { foreignKey: "userId" });
      this.hasMany(Comment, { foreignKey: "userId" });
      this.hasMany(Like, { foreignKey: "userId" });
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      username: DataTypes.STRING,
      role: DataTypes.STRING,
      refreshToken: DataTypes.TEXT,
      isVerified: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      freezeTableName: true,
    },
  );
  return User;
};
