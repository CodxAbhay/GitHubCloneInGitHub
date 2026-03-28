const express = require("express");
const repoController = require("../controllers/repoController");
const authMiddleware = require("../middleware/authMiddleware");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

const repoRouter = express.Router();

// Public repository endpoints (specific paths before /repo/:id)
repoRouter.get("/repo/all", repoController.getAllRepository);
repoRouter.get(
  "/repo/name/:name",
  optionalAuthMiddleware,
  repoController.fetchRepositoryByName,
);
repoRouter.get("/repo/search/:term", repoController.searchRepositories);
repoRouter.get(
  "/repo/public/user/:userId",
  repoController.fetchPublicRepositoriesByUser,
);

// Repositories for a specific user (requires auth)
repoRouter.get(
  "/repo/user/:userId",
  authMiddleware,
  repoController.fetchRepositoriesByCurrentUser
);

// ⭐ GET USER STARRED REPOS (requires auth) — before /repo/:id
repoRouter.get(
  "/repo/starred/:userId",
  authMiddleware,
  repoController.getStarredRepositories
);

repoRouter.get(
  "/repo/:id",
  optionalAuthMiddleware,
  repoController.fetchRepositoryById,
);

// Create / update / delete repo (requires auth)
repoRouter.post(
  "/repo/create",
  authMiddleware,
  repoController.createRepository
);
repoRouter.put(
  "/repo/update/:id",
  authMiddleware,
  repoController.updateRepositoryByID
);
repoRouter.delete(
  "/repo/delete/:id",
  authMiddleware,
  repoController.deleteRepositoryByID
);

repoRouter.post(
  "/repo/fork/:id",
  authMiddleware,
  repoController.forkRepository,
);

// Collaborator management (requires auth)
repoRouter.get(
  "/repo/:id/collaborators",
  authMiddleware,
  repoController.getCollaborators
);
repoRouter.post(
  "/repo/:id/collaborators",
  authMiddleware,
  repoController.addCollaborator
);
repoRouter.delete(
  "/repo/:id/collaborators/:userId",
  authMiddleware,
  repoController.removeCollaborator
);

// Toggle visibility (requires auth)
repoRouter.patch(
  "/repo/toggel/:id",
  authMiddleware,
  repoController.toggelVisibilityByID
);

// ⭐ STAR SYSTEM (requires auth)
repoRouter.patch(
  "/repo/star/:id",
  authMiddleware,
  repoController.toggleStarRepository
);

// 👀 WATCH SYSTEM (requires auth)
repoRouter.patch(
  "/repo/watch/:id",
  authMiddleware,
  repoController.toggleWatchRepository
);

module.exports = repoRouter;
