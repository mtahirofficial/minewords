'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Blogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      excerpt: {
        type: Sequelize.TEXT
      },
      content: {
        type: Sequelize.TEXT
      },
      category: {
        type: Sequelize.STRING
      },
      author: {
        type: Sequelize.STRING
      },
      readTime: {
        type: Sequelize.STRING
      },
      date: {
        type: Sequelize.DATE
      },
      userId: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Blogs');
  }
};
