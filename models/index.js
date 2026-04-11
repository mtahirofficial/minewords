'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
require("dotenv").config();
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  const rawUrl = String(process.env[config.use_env_variable] || "").trim();
  // Some hosting panels store `%` as `\%`, which breaks URL parsing in newer Node.js.
  const normalizedUrl = rawUrl.replace(/\\%/g, "%");
  sequelize = new Sequelize(normalizedUrl, config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
