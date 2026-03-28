const express = require("express");
const rateLimit = require("express-rate-limit");
const commitController = require("../controllers/commitController");
const authMiddleware = require("../middleware/authMiddleware");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");
const upload = require("../middleware/uploadMiddleware");
const uploadErrorMiddleware = require("../middleware/uploadErrorMiddleware");

const commitRouter = express.Router();

const commitCreateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_COMMIT_WINDOW_MS || "900000", 10),
  max: parseInt(process.env.RATE_LIMIT_COMMIT_MAX || "60", 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many uploads. Please try again in a few minutes.",
    });
  },
});

const uploadFilesMiddleware = upload.array("files");

function uploadWithErrorHandling(req, res, next) {
  uploadFilesMiddleware(req, res, (err) => {
    if (err) return uploadErrorMiddleware(err, req, res, next);
    next();
  });
}

commitRouter.post(
  "/commit/create",
  commitCreateLimiter,
  authMiddleware,
  uploadWithErrorHandling,
  commitController.createCommit,
);

commitRouter.post(
  "/commit/revert/:repoId",
  authMiddleware,
  commitController.revertRepoToCommit,
);

commitRouter.get(
  "/repo/pull/:repoId/manifest",
  optionalAuthMiddleware,
  commitController.getPullManifest,
);

commitRouter.get(
  "/commit/repo/:repoId",
  optionalAuthMiddleware,
  commitController.getRepositoryCommits,
);

commitRouter.get(
  "/repo/files/:repoId",
  optionalAuthMiddleware,
  commitController.getRepositoryFiles,
);

commitRouter.get(
  "/repo/tree/:repoId",
  optionalAuthMiddleware,
  commitController.getRepositoryFileTree,
);

commitRouter.delete(
  "/repo/file/delete",
  authMiddleware,
  commitController.deleteFile,
);

module.exports = commitRouter;
