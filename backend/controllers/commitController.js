const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Commit = require("../models/commitModel");
const Repository = require("../models/repoModel");
const { s3, s3_bucket } = require("../config/aws_config");
const path = require("path");

async function requireReadableRepo(repoId, userId) {
  if (!repoId || !mongoose.Types.ObjectId.isValid(repoId)) {
    return { ok: false, status: 400, message: "Invalid repository ID" };
  }

  const repository = await Repository.findById(repoId);
  if (!repository) {
    return { ok: false, status: 404, message: "Repository not found" };
  }

  if (repository.visibility === false) {
    const isOwner =
      userId && repository.owner?.toString?.() === userId.toString();
    const isCollaborator =
      userId &&
      Array.isArray(repository.collaborators) &&
      repository.collaborators.some((c) => c.toString() === userId.toString());

    if (!isOwner && !isCollaborator) {
      return { ok: false, status: 404, message: "Repository not found" };
    }
  }

  return { ok: true, repository };
}

/* ===============================
   CREATE COMMIT
================================ */

async function createCommit(req, res) {
  const { repoId, message } = req.body;

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const repository = await Repository.findById(repoId);

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    // Permission: only owner or collaborator can push
    const userId = req.user?.id;
    const isOwner =
      userId && repository.owner?.toString?.() === userId.toString();
    const isCollaborator =
      userId &&
      Array.isArray(repository.collaborators) &&
      repository.collaborators.some((c) => c.toString() === userId.toString());

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you do not have write access to this repository",
      });
    }

    const maxTotalMb = parseInt(
      process.env.MAX_UPLOAD_TOTAL_MB || "50",
      10,
    );
    let totalBytes = 0;
    for (const f of req.files) {
      totalBytes += f.buffer?.length || 0;
    }
    if (totalBytes > maxTotalMb * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        message: `Total upload too large for one commit. Maximum is ${maxTotalMb} MB combined.`,
      });
    }

    const commitId = uuidv4();

    // Get previous commit (for Git-like snapshot behavior)
    const previousCommit = await Commit.findOne({ repository: repoId }).sort({
      createdAt: -1,
    });

    let files = previousCommit ? [...previousCommit.files] : [];
    const changedFiles = [];

    let pathsArray = req.body.paths;
    if (pathsArray && !Array.isArray(pathsArray)) {
      pathsArray = [pathsArray];
    }

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      const originalPath = pathsArray?.[i] || file.originalname;
      const normalizedPath = String(originalPath).replaceAll("\\", "/");

      console.log("Uploaded file path:", normalizedPath);
      const fileName = path.basename(normalizedPath);
      const filePath = normalizedPath;

      const s3Key = `repos/${repoId}/${commitId}/${filePath}`;

      const uploadParams = {
        Bucket: s3_bucket,
        Key: s3Key,
        Body: file.buffer,
      };

      await s3.upload(uploadParams).promise();

      const signedUrl = s3.getSignedUrl("getObject", {
        Bucket: s3_bucket,
        Key: s3Key,
        Expires: 60 * 60 * 24 * 365,
      });

      const existingIndex = files.findIndex((f) => f.filePath === filePath);
      const status = existingIndex >= 0 ? "modified" : "added";
      if (existingIndex >= 0) {
        files.splice(existingIndex, 1);
      }

      files.push({
        fileName,
        filePath,
        url: signedUrl,
      });
      changedFiles.push({
        fileName,
        filePath,
        status,
      });
    }

    const commit = new Commit({
      repository: repoId,
      commitMessage: message,
      commitId: commitId,
      files: files,
      changedFiles,
    });

    await commit.save();

    res.status(201).json({
      success: true,
      data: commit,
    });
  } catch (error) {
    console.error("Create Commit Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

/* ===============================
   GET REPOSITORY COMMITS
================================ */

async function getRepositoryCommits(req, res) {
  const { repoId } = req.params;

  try {
    const gate = await requireReadableRepo(repoId, req.user?.id);
    if (!gate.ok) {
      return res.status(gate.status).json({
        success: false,
        message: gate.message,
      });
    }

    const commits = await Commit.find({
      repository: repoId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: commits,
    });
  } catch (error) {
    console.error("Get commits error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

/* ===============================
   GET REPOSITORY FILES
================================ */

async function getRepositoryFiles(req, res) {
  const { repoId } = req.params;

  try {
    const gate = await requireReadableRepo(repoId, req.user?.id);
    if (!gate.ok) {
      return res.status(gate.status).json({
        success: false,
        message: gate.message,
      });
    }

    const latestCommit = await Commit.findOne({ repository: repoId }).sort({
      createdAt: -1,
    });

    if (!latestCommit) {
      return res.status(404).json({
        success: false,
        message: "No commits found",
      });
    }

    const files = latestCommit.files.map((file) => {
      return {
        fileName: file.fileName || file.filePath,
        filePath: file.filePath || file.fileName,
        url: file.url,
      };
    });

    res.status(200).json({
      success: true,
      files,
    });
  } catch (error) {
    console.error("Fetch files error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

/* ===============================
   GET FILE TREE (GitHub style)
================================ */

async function getRepositoryFileTree(req, res) {
  const { repoId } = req.params;

  try {
    const gate = await requireReadableRepo(repoId, req.user?.id);
    if (!gate.ok) {
      return res.status(gate.status).json({
        success: false,
        message: gate.message,
      });
    }

    const latestCommit = await Commit.findOne({ repository: repoId }).sort({
      createdAt: -1,
    });

    if (!latestCommit) {
      return res.json({
        success: true,
        tree: {},
      });
    }

    const tree = {};

    for (const file of latestCommit.files) {
      const filePath = file.filePath || file.fileName;

      if (!filePath) continue;

      const parts = filePath.split("/");

      let current = tree;

      parts.forEach((part, index) => {
        if (!current[part]) {
          if (index === parts.length - 1) {
            current[part] = {
              type: "file",
              url: file.url,
            };
          } else {
            current[part] = {};
          }
        }

        current = current[part];
      });
    }

    res.json({
      success: true,
      tree,
    });
  } catch (error) {
    console.error("File tree error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load repository tree",
    });
  }
}

async function deleteFile(req,res){

  const {repoId,filePath} = req.body;

  try{
    const repository = await Repository.findById(repoId);
    if (!repository) {
      return res.status(404).json({ success: false, message: "Repository not found" });
    }

    const userId = req.user?.id;
    const isOwner =
      userId && repository.owner?.toString?.() === userId.toString();
    const isCollaborator =
      userId &&
      Array.isArray(repository.collaborators) &&
      repository.collaborators.some((c) => c.toString() === userId.toString());

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you do not have write access to this repository",
      });
    }

    const previousCommit = await Commit
      .findOne({repository:repoId})
      .sort({createdAt:-1});

    if(!previousCommit){
      return res.status(404).json({
        success:false,
        message:"No commits found"
      });
    }

    const newFiles = previousCommit.files.filter(
      f => f.filePath !== filePath
    );

    const commit = new Commit({
      repository:repoId,
      commitMessage:`Delete ${filePath}`,
      commitId:uuidv4(),
      files:newFiles,
      changedFiles: [
        {
          fileName: path.basename(filePath),
          filePath,
          status: "deleted",
        },
      ],
    });

    await commit.save();

    res.json({
      success:true
    });

  }catch(err){

    console.error(err);

    res.status(500).json({
      success:false
    });

  }

}

/* ===============================
   REVERT: new commit = snapshot of target commit (API history)
================================ */

async function revertRepoToCommit(req, res) {
  const { repoId } = req.params;
  const { targetCommitId } = req.body;

  try {
    if (!targetCommitId) {
      return res.status(400).json({
        success: false,
        message: "targetCommitId is required",
      });
    }

    const repository = await Repository.findById(repoId);
    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    const userId = req.user?.id;
    const isOwner =
      userId && repository.owner?.toString?.() === userId.toString();
    const isCollaborator =
      userId &&
      Array.isArray(repository.collaborators) &&
      repository.collaborators.some((c) => c.toString() === userId.toString());

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you do not have write access to this repository",
      });
    }

    const target = await Commit.findOne({
      repository: repoId,
      commitId: targetCommitId,
    });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "Target commit not found in this repository",
      });
    }

    const latest = await Commit.findOne({ repository: repoId }).sort({
      createdAt: -1,
    });
    const latestMap = new Map(
      (latest?.files || []).map((f) => [f.filePath || f.fileName, f.url]),
    );

    const newCommitId = uuidv4();
    const filesCopy = (target.files || []).map((f) => ({
      fileName: f.fileName,
      filePath: f.filePath,
      url: f.url,
    }));
    const changedFiles = [];
    for (const f of filesCopy) {
      const key = f.filePath || f.fileName;
      if (!latestMap.has(key) || latestMap.get(key) !== f.url) {
        changedFiles.push({
          fileName: f.fileName,
          filePath: f.filePath,
          status: "reverted",
        });
      }
      latestMap.delete(key);
    }
    for (const removedPath of latestMap.keys()) {
      changedFiles.push({
        fileName: path.basename(removedPath),
        filePath: removedPath,
        status: "deleted",
      });
    }

    const commit = new Commit({
      repository: repoId,
      commitMessage: `Revert to ${targetCommitId.slice(0, 8)}`,
      commitId: newCommitId,
      files: filesCopy,
      changedFiles,
    });

    await commit.save();

    res.status(201).json({
      success: true,
      data: commit,
    });
  } catch (err) {
    console.error("Revert commit error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

/* ===============================
   PULL MANIFEST (CLI / downloads)
================================ */

async function getPullManifest(req, res) {
  const { repoId } = req.params;

  try {
    const gate = await requireReadableRepo(repoId, req.user?.id);
    if (!gate.ok) {
      return res.status(gate.status).json({
        success: false,
        message: gate.message,
      });
    }

    const latestCommit = await Commit.findOne({ repository: repoId }).sort({
      createdAt: -1,
    });

    if (!latestCommit) {
      return res.json({
        success: true,
        data: {
          commitId: null,
          commitMessage: null,
          files: [],
        },
      });
    }

    res.json({
      success: true,
      data: {
        commitId: latestCommit.commitId,
        commitMessage: latestCommit.commitMessage,
        files: latestCommit.files.map((f) => ({
          filePath: f.filePath || f.fileName,
          fileName: f.fileName,
          url: f.url,
        })),
      },
    });
  } catch (err) {
    console.error("Pull manifest error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

module.exports = {
  createCommit,
  getRepositoryCommits,
  getRepositoryFiles,
  getRepositoryFileTree,
  deleteFile,
  revertRepoToCommit,
  getPullManifest,
};
