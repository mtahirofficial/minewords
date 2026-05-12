'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Blogs', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'published',
    });

    await queryInterface.addIndex('Blogs', ['status'], {
      name: 'blogs_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Blogs', 'blogs_status_idx');
    await queryInterface.removeColumn('Blogs', 'status');
  },
};

