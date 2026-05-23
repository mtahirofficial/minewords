const Busboy = require("busboy");

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function parseMultipartSingle(fieldName, options = {}) {
  const maxFileSizeBytes = options.maxFileSizeBytes ?? 5 * 1024 * 1024;

  return function busboySingle(req, _res, next) {
    const contentType = String(req.headers["content-type"] || "");
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return next();
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: maxFileSizeBytes,
        files: 1,
      },
    });

    req.body = req.body || {};
    req.file = null;

    let fileTooLarge = false;
    let fileChunks = [];
    let fileInfo = null;

    busboy.on("field", (name, value) => {
      if (name in req.body) {
        const current = req.body[name];
        req.body[name] = Array.isArray(current) ? [...current, value] : [current, value];
        return;
      }
      req.body[name] = value;
    });

    busboy.on("file", (name, file, info) => {
      if (name !== fieldName) {
        file.resume();
        return;
      }

      const filename = info?.filename || "upload";
      const mimetype = info?.mimeType || info?.mimetype || "";

      if (mimetype && !allowedMimeTypes.has(mimetype)) {
        file.resume();
        const err = new Error("Only JPG, PNG, WEBP, and GIF images are allowed.");
        err.status = 400;
        busboy.emit("error", err);
        return;
      }

      fileInfo = { filename, mimetype };

      file.on("limit", () => {
        fileTooLarge = true;
      });

      file.on("data", (chunk) => {
        fileChunks.push(chunk);
      });
    });

    busboy.on("error", (err) => {
      next(err);
    });

    busboy.on("finish", () => {
      if (fileTooLarge) {
        const err = new Error("File too large. Max size is 5MB.");
        err.status = 400;
        return next(err);
      }

      if (fileInfo) {
        const buffer = Buffer.concat(fileChunks);
        req.file = {
          buffer,
          originalname: fileInfo.filename,
          mimetype: fileInfo.mimetype,
          size: buffer.length,
        };
      }
      next();
    });

    req.pipe(busboy);
  };
}

module.exports = { parseMultipartSingle };

