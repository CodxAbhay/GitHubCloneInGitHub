const express = require("express");
const issueController = require("../controllers/issueController");
const authMiddleware = require("../middleware/authMiddleware");

const issueRouter = express.Router();

// Create / modify issues (requires auth)
issueRouter.post("/issue/create", authMiddleware, issueController.createIssue);
issueRouter.put(
  "/issue/update/:id",
  authMiddleware,
  issueController.updateIssueById
);
issueRouter.delete(
  "/issue/delete/:id",
  authMiddleware,
  issueController.deleteIssueById
);

// Public reads
issueRouter.get("/issue/all", issueController.getAllIssue);
issueRouter.get("/issue/:id", issueController.getIssueById);

module.exports = issueRouter;