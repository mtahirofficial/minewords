'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Like extends Model {
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
  Like.init({
    userId: DataTypes.INTEGER,
    blogId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Like',
  });
  return Like;
};