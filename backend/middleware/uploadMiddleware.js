const multer = require("multer");

const maxFileMb = parseInt(process.env.MAX_UPLOAD_FILE_MB || "10", 10);
const maxFiles = parseInt(process.env.MAX_FILES_PER_COMMIT || "200", 10);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileMb * 1024 * 1024,
    files: maxFiles,
  },
});

module.exports = upload;
