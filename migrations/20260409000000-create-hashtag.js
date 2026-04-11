'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Hashtags', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
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

    await queryInterface.addIndex('Hashtags', ['name'], {
      unique: true,
      name: 'hashtags_name_unique_idx'
    });

    await queryInterface.addIndex('Hashtags', ['count'], {
      name: 'hashtags_count_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Hashtags');
  }
};
