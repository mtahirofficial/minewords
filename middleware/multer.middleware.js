const multer = require("multer");
const path = require("path");
const fs = require("fs");

const directory = "files";
const uploadDirectory = path.join(__dirname, `../${directory}`);
const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]);

const generateFileName = (f) => {
    const extension = (f.mimetype || "").split("/")[1] || "bin";
    return `${f.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        fs.mkdirSync(uploadDirectory, { recursive: true });
        cb(null, uploadDirectory);
    },
    filename: function (req, file, cb) {
        cb(null, generateFileName(file));
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            const err = new Error("Only JPG, PNG, WEBP, and GIF images are allowed.");
            err.status = 400;
            return cb(err);
        }
        cb(null, true);
    },
});
const baseFilePath = `/${directory}/`;
const generateFilePath = file => `/${directory}/${generateFileName(file)}`;

const MulterMiddleware = { upload, baseFilePath, generateFileName, generateFilePath }

module.exports = MulterMiddleware
