const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const { join } = require("path");
const { ErrorsMiddleware, LoggerMiddleware } = require("./middleware");
const { ConsoleLogger } = require("./core");
const path = require("path");
const cron = require("node-cron");
const cookieParser = require("cookie-parser");

// This runs every day at midnight
cron.schedule("0 0 * * *", () => {});

class AppServer {
  _app = express();
  _port = 9000;
  _server;

  constructor(controllers = []) {
    dotenv.config();
    this.initMiddleWares();
    this.initLogger();
    this.initializeControllers(controllers);
    if (process.env.IS_SSR) {
      this.loadSSRView();
    }
    this.initErrorHandling();
  }

  buildCorsOpt() {
    const configCors = process.env.CORS_ALLOW_ORIGINS;
    if (!configCors) {
      throw new Error("ENV CORS not provider!");
    }
    return {
      origin: configCors,
      methods: "OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
    };
  }

  initMiddleWares() {
    this._app.use(cors(this.buildCorsOpt()));
    this._app.use(bodyParser.json({ limit: "50mb" }));
    this._app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
  }

  loadSSRView() {
    const distDir = join(__dirname, "dist");
    const filesDir = join(__dirname, "files");

    // Serve uploaded/static files directly from backend.
    this._app.use("/files", express.static(filesDir));
    // Serve frontend build output (includes /assets/* from Vite).
    this._app.use(express.static(distDir));

    // SPA fallback: never hijack API or file endpoints.
    this._app.get("/{*path}", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/files")) {
        return next();
      }

      res.sendFile(
        "index.html",
        { root: distDir },
        (err) => {
          if (err)
            res.send(
              `<div style="text-align: center;font-size: xxx-large;color: red;margin-top: 100px;">Maintenance in progress...</div><div style="text-align: center;font-size: 16px;color: red;margin-top: 20px;">Checkout is functional just app dashboard in maintenance.</div>`,
            );
          res.end();
        },
      );
    });
  }

  initErrorHandling() {
    this._app.use(ErrorsMiddleware);
  }

  initLogger() {
    this._app.use(LoggerMiddleware);
  }

  enableStaticFile() {
    this._app.use(express.static(join(__dirname, "public")));
    this._app.use(express.static(join(__dirname, "dist")));
    this._app.use("/files", express.static(join(__dirname, "files")));
  }

  initializeControllers(controllers = []) {
    this._app.use(cookieParser());
    controllers.forEach((c) => {
      this._app.use("/api", c._router);
    });
  }

  startListening() {
    const PORT = process.env.PORT || this._port;
    this._server = this._app.listen(PORT, () => {
      ConsoleLogger.info(`Server started on ${PORT}!`);
    });
    // new SocketServer(this._server);
  }
}

module.exports = AppServer;
