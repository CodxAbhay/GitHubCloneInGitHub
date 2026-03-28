const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorizeUserSelf } = require("../middleware/authorizeMiddleware");

const userRouter = express.Router();

// Auth
userRouter.post("/signup", userController.signup);
userRouter.post("/login", userController.login);

// Users
userRouter.get("/allUsers", userController.getAllUsers);
userRouter.get("/userProfile/:id", userController.getUserProfile);
userRouter.put(
  "/updateProfile/:id",
  authMiddleware,
  authorizeUserSelf,
  userController.updateUserProfile
);
userRouter.delete(
  "/deleteProfile/:id",
  authMiddleware,
  authorizeUserSelf,
  userController.deleteUserProfile
);

// Follow system
userRouter.post(
  "/user/:id/follow",
  authMiddleware,
  userController.followUser
);
userRouter.post(
  "/user/:id/unfollow",
  authMiddleware,
  userController.unfollowUser
);
userRouter.get("/user/:id/following", userController.getFollowing);
userRouter.get("/user/:id/followers", userController.getFollowers);

// Personal Access Tokens (PAT) for CLI pushing (requires auth)
userRouter.post("/user/pat", authMiddleware, userController.createPat);
userRouter.get("/user/pat", authMiddleware, userController.listPats);
userRouter.delete("/user/pat/:patId", authMiddleware, userController.revokePat);

module.exports = userRouter;