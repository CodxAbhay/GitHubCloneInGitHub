const multer = require("multer");

function uploadErrorMiddleware(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const maxMb = process.env.MAX_UPLOAD_FILE_MB || "10";
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: `File too large. Maximum allowed size is ${maxMb} MB per file.`,
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      const maxFiles = process.env.MAX_FILES_PER_COMMIT || "200";
      return res.status(413).json({
        success: false,
        message: `Too many files in one commit. Maximum is ${maxFiles} files.`,
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field in upload.",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }
  return next(err);
}

module.exports = uploadErrorMiddleware;
