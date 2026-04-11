const {
    AuthController,
    BlogController,
    LikeController,
    CommentController,
    ContactController,
    NewsletterController
} = require('./controllers')

const AppServer = require('./appServer.js');

const app = new AppServer([
    new AuthController,
    new BlogController,
    new LikeController,
    new CommentController,
    new ContactController,
    new NewsletterController
]);
app.startListening()