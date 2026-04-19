const {
    AuthController,
    BlogController,
    LikeController,
    CommentController,
    ContactController,
    NewsletterController
} = require('./controllers')
const { sequelize } = require("./models");
const { ConsoleLogger } = require("./core");

const AppServer = require('./appServer.js');

const app = new AppServer([
    new AuthController,
    new BlogController,
    new LikeController,
    new CommentController,
    new ContactController,
    new NewsletterController
]);

const bootstrap = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        ConsoleLogger.info("Database connected and synchronized.");
        await app.startListening();
    } catch (error) {
        ConsoleLogger.error(`Database bootstrap failed: ${error.message}`);
        process.exit(1);
    }
};

bootstrap();
