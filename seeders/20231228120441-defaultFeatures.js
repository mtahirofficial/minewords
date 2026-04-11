'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
    */
    await queryInterface.bulkInsert('features', [
      {
        name: 'Shipping Rates',
        handle: 'rates',
      },
      {
        name: 'Shipping Ranges',
        handle: 'ranges',
      },
      {
        name: 'Zipcode Prefix',
        handle: 'zip_prefix',
      },
      {
        name: 'Zipcode Ranges',
        handle: 'zip_ranges',
      },
      {
        name: 'Default Shipping Price',
        handle: 'default_price',
      },
      {
        name: 'Free Shipping Scheduled',
        handle: 'free_scheduled',
      },
      {
        name: 'Free Shipping Products',
        handle: 'free_products',
      },
      {
        name: 'Exceptions',
        handle: 'exceptions',
      },
      {
        name: 'Estimated Shipping Rates',
        handle: 'widget',
      },
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
