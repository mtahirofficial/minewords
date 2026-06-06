const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const { join } = require("path");
const { createRequire } = require("module");
const { ErrorsMiddleware, LoggerMiddleware } = require("./middleware");
const { ConsoleLogger } = require("./core");
const path = require("path");
const cookieParser = require("cookie-parser");

class AppServer {
  _app = express();
  _port = 9000;
  _server;
  _frontendReady = Promise.resolve();

  constructor(controllers = []) {
    dotenv.config();
    this.initMiddleWares();
    this.initLogger();
    this.initializeControllers(controllers);
    const ssrEnabled =
      String(process.env.IS_SSR || "true")
        .trim()
        .toLowerCase() !== "false";
    if (ssrEnabled) {
      this.initFrontendRenderer();
    } else {
      this.registerStaticFrontend();
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

  registerStaticFrontend() {
    const distDir = join(__dirname, "dist");
    const filesDir = join(__dirname, "files");
    const publicDir = join(__dirname, "client", "public");

    // Serve uploaded/static files directly from backend.
    this._app.use("/files", express.static(filesDir));
    // Expose public assets used by the branded fallback screen.
    this._app.use(express.static(publicDir));
    // Serve frontend build output (includes /assets/* from Vite).
    this._app.use(express.static(distDir));

    // SPA fallback: never hijack API or file endpoints.
    this._app.get("/{*path}", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/files")) {
        return next();
      }

      const appName = process.env.APP_NAME || "MineWords";
      const fallbackHtml = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:linear-gradient(135deg,#f8fbff 0%,#eef5ff 48%,#fff7ed 100%);font-family:Inter,Segoe UI,Arial,sans-serif;">
          <div style="max-width:560px;width:100%;background:rgba(255,255,255,.92);border:1px solid rgba(23,63,109,.12);border-radius:24px;box-shadow:0 24px 80px rgba(15,23,42,.12);padding:40px 32px;text-align:center;">
            <div style="display:flex;align-items:center;justify-content:center;margin:0 0 20px;">
              <div style="display:flex;align-items:center;justify-content:center;width:88px;height:88px;border-radius:24px;background:linear-gradient(135deg,#ffffff 0%,#f8fbff 100%);box-shadow:0 10px 30px rgba(23,63,109,.14);border:1px solid rgba(23,63,109,.08);overflow:hidden;">
                <img src="/minewords-logo.png" alt="${appName} logo" style="display:block;width:74px;height:74px;object-fit:contain;" />
              </div>
            </div>
            <p style="margin:0 0 12px;color:#c96a17;font-size:14px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">
              Temporary maintenance
            </p>
            <h1 style="margin:0 0 14px;color:#173f6d;font-size:clamp(28px,4vw,40px);line-height:1.15;">
              ${appName} is getting a quick refresh
            </h1>
            <p style="margin:0;color:#475569;font-size:17px;line-height:1.7;">
              We’re polishing the reading experience and bringing things back shortly.
              Please check again in a bit — your next story is on the way.
            </p>
          </div>
        </div>`;

      return res.sendFile("index.html", { root: distDir }, (err) => {
        if (err) return res.status(503).send(fallbackHtml);
        return res.end();
      });
    });

    ConsoleLogger.info("Frontend renderer: static dist fallback");
  }

  initFrontendRenderer() {
    // Keep file hosting available in all modes.
    this._app.use("/files", express.static(join(__dirname, "files")));
    // Serve Next static chunks explicitly to avoid intermittent 404s
    // when requests hit fallback routes before Next handles them.
    this._app.use(
      "/_next/static",
      express.static(join(__dirname, "client", ".next", "static")),
    );

    const preferStatic =
      String(process.env.FRONTEND_RENDERER || "")
        .trim()
        .toLowerCase() === "static";

    if (preferStatic) {
      this.registerStaticFrontend();
      return;
    }

    let next;
    let nextApp;
    let isDev;
    try {
      const requireFromClient = createRequire(
        join(__dirname, "client", "package.json"),
      );
      next = requireFromClient("next");
      const nextDir = join(__dirname, "client");
      const nextDevEnv = String(process.env.NEXT_DEV || "")
        .trim()
        .toLowerCase();
      isDev = nextDevEnv
        ? nextDevEnv === "true"
        : String(process.env.NODE_ENV || "")
            .trim()
            .toLowerCase() !== "production";
      nextApp = next({ dev: isDev, dir: nextDir });
    } catch (error) {
      ConsoleLogger.error(
        `Next.js module load failed, using static fallback: ${error.message}`,
      );
      this.registerStaticFrontend();
      return;
    }

    this._frontendReady = nextApp
      .prepare()
      .then(() => {
        const handle = nextApp.getRequestHandler();
        this._app.get("/{*path}", (req, res, nextFn) => {
          if (req.path.startsWith("/api") || req.path.startsWith("/files")) {
            return nextFn();
          }
          return handle(req, res);
        });
        ConsoleLogger.info(
          `Frontend renderer: Next.js server (${isDev ? "dev" : "production"})`,
        );
      })
      .catch((error) => {
        ConsoleLogger.error(
          `Next.js renderer failed, using static fallback: ${error.message}`,
        );
        this.registerStaticFrontend();
      });
  }

  initErrorHandling() {
    this._app.use(ErrorsMiddleware);
  }

  initLogger() {
    this._app.use(LoggerMiddleware);
  }

  enableStaticFile() {
    this._app.use(express.static(join(__dirname, "client", "public")));
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

  async startListening() {
    await this._frontendReady;
    const PORT = process.env.PORT || this._port;
    this._server = this._app.listen(PORT, () => {
      ConsoleLogger.info(`Server started on ${PORT}!`);
    });
    // new SocketServer(this._server);
  }
}

module.exports = AppServer;
