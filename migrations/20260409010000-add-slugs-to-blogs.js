'use strict';

const makeBaseSlug = (value = "", fallback = "item") =>
  String(value || fallback)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Blogs', 'slug', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Blogs', 'categorySlug', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    const [blogs] = await queryInterface.sequelize.query(
      'SELECT id, title, category FROM Blogs ORDER BY id ASC'
    );

    const usedBlogSlugs = new Set();

    for (const blog of blogs) {
      const blogBase = makeBaseSlug(blog.title, `blog-${blog.id}`);
      let blogSlug = blogBase;
      let suffix = 1;
      while (usedBlogSlugs.has(blogSlug)) {
        blogSlug = `${blogBase}-${suffix++}`;
      }
      usedBlogSlugs.add(blogSlug);

      const categorySlug = makeBaseSlug(blog.category, 'general');

      await queryInterface.sequelize.query(
        'UPDATE Blogs SET slug = :slug, categorySlug = :categorySlug WHERE id = :id',
        {
          replacements: { id: blog.id, slug: blogSlug, categorySlug },
        }
      );
    }

    await queryInterface.changeColumn('Blogs', 'slug', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });

    await queryInterface.changeColumn('Blogs', 'categorySlug', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addIndex('Blogs', ['slug'], {
      unique: true,
      name: 'blogs_slug_unique_idx',
    });

    await queryInterface.addIndex('Blogs', ['categorySlug'], {
      name: 'blogs_category_slug_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Blogs', 'blogs_category_slug_idx');
    await queryInterface.removeIndex('Blogs', 'blogs_slug_unique_idx');
    await queryInterface.removeColumn('Blogs', 'categorySlug');
    await queryInterface.removeColumn('Blogs', 'slug');
  },
};
