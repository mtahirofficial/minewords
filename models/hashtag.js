"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Hashtag extends Model {
    static associate() {
      // No direct association required for now.
    }
  }

  Hashtag.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "Hashtag",
      tableName: "hashtags",
      freezeTableName: true,
    },
  );

  return Hashtag;
};
