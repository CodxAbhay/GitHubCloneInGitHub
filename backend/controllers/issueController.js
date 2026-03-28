const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const Issue = require("../models/issueModel");

function canWrite(repository, userId) {
  const isOwner =
    userId && repository.owner?.toString?.() === userId.toString();
  const isCollaborator =
    userId &&
    Array.isArray(repository.collaborators) &&
    repository.collaborators.some((c) => c.toString() === userId.toString());
  return Boolean(isOwner || isCollaborator);
}

// ========================================
// CREATE ISSUE
// ========================================
async function createIssue(req, res) {
  const { title, description, repository } = req.body;

  try {
    if (!title || !description || !repository) {
      return res.status(400).json({
        success: false,
        message: "Title, description and repository ID are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(repository)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository ID",
      });
    }

    const repoExists = await Repository.findById(repository);
    if (!repoExists) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    const issue = new Issue({
      title,
      description,
      repository,
      author: req.user.id,
    });

    const savedIssue = await issue.save();

    // Push issue into repository issues array
    repoExists.issues.push(savedIssue._id);
    await repoExists.save();

    res.status(201).json({
      success: true,
      data: savedIssue,
    });

  } catch (error) {
    console.error("Create Issue Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating issue",
    });
  }
}

// ========================================
// GET ALL ISSUES
// ========================================
async function getAllIssue(req, res) {
  try {
    const issues = await Issue.find()
      .populate("repository", "name description");

    res.status(200).json({
      success: true,
      data: issues,
    });

  } catch (error) {
    console.error("Get All Issues Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching issues",
    });
  }
}

// ========================================
// GET ISSUE BY ID
// ========================================
async function getIssueById(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
    }

    const issue = await Issue.findById(id)
      .populate("repository", "name description");

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.status(200).json({
      success: true,
      data: issue,
    });

  } catch (error) {
    console.error("Get Issue By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching issue",
    });
  }
}

// ========================================
// UPDATE ISSUE BY ID
// ========================================
async function updateIssueById(req, res) {
  const { id } = req.params;
  const { title, description, status } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
    }

    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    const repo = await Repository.findById(issue.repository);
    const isAuthor = issue.author && issue.author.toString() === req.user?.id?.toString();
    if (!repo || (!canWrite(repo, req.user?.id) && !isAuthor)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: write or author access required",
      });
    }

    if (title) issue.title = title;
    if (description) issue.description = description;

    if (status) {
      if (!["open", "closed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be either 'open' or 'closed'",
        });
      }
      issue.status = status;
    }
    issue.updatedAt = new Date();

    const updatedIssue = await issue.save();

    res.status(200).json({
      success: true,
      data: updatedIssue,
    });

  } catch (error) {
    console.error("Update Issue Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating issue",
    });
  }
}

// ========================================
// DELETE ISSUE BY ID
// ========================================
async function deleteIssueById(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
    }

    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    const repo = await Repository.findById(issue.repository);
    const isAuthor = issue.author && issue.author.toString() === req.user?.id?.toString();
    if (!repo || (!canWrite(repo, req.user?.id) && !isAuthor)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: write or author access required",
      });
    }

    // Remove issue from repository issues array
    await Repository.findByIdAndUpdate(issue.repository, {
      $pull: { issues: issue._id },
    });

    await Issue.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });

  } catch (error) {
    console.error("Delete Issue Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting issue",
    });
  }
}

module.exports = {
  createIssue,
  updateIssueById,
  deleteIssueById,
  getAllIssue,
  getIssueById,
};