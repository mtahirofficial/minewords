'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
    */
    await queryInterface.bulkInsert('plans', [
      {
        name: 'Basic',
        handle: 'basic',
      },
      {
        name: 'Advanced',
        handle: 'advanced',
      },
      {
        name: 'Enterprise',
        handle: 'enterprise',
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
