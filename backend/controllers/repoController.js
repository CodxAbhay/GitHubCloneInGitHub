const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");
const Commit = require("../models/commitModel");
const { s3, s3_bucket } = require("../config/aws_config");

function hasWriteAccess(repository, userId) {
  const isOwner =
    userId && repository.owner?.toString?.() === userId.toString();
  const isCollaborator =
    userId &&
    Array.isArray(repository.collaborators) &&
    repository.collaborators.some((c) => c.toString() === userId.toString());
  return Boolean(isOwner || isCollaborator);
}

// ===================================
// CREATE REPOSITORY 
// ===================================
async function createRepository(req, res) {
  const { owner, name, issues, content, description, visibility } = req.body;

  try {
    if (!owner || !name) {
      return res.status(400).json({
        success: false,
        message: "Owner and name are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({
        success: false,
        message: "Invalid owner ID",
      });
    }

    const userExists = await User.findById(owner);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    const requesterId = req.user?.id;
    if (!requesterId || requesterId.toString() !== owner.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: owner must match authenticated user",
      });
    }

    const newRepository = new Repository({
      name,
      description,
      content,
      visibility,
      owner,
      issues,
    });

    const savedRepository = await newRepository.save();

    if (content && String(content).trim()) {
      const commitId = uuidv4();
      const readmePath = "README.md";
      const s3Key = `repos/${savedRepository._id}/${commitId}/${readmePath}`;

      await s3
        .upload({
          Bucket: s3_bucket,
          Key: s3Key,
          Body: Buffer.from(String(content), "utf8"),
          ContentType: "text/markdown; charset=utf-8",
        })
        .promise();

      const signedUrl = s3.getSignedUrl("getObject", {
        Bucket: s3_bucket,
        Key: s3Key,
        Expires: 60 * 60 * 24 * 365,
      });

      await Commit.create({
        repository: savedRepository._id,
        commitMessage: "Initial commit",
        commitId,
        files: [
          {
            fileName: "README.md",
            filePath: "README.md",
            url: signedUrl,
          },
        ],
        changedFiles: [
          {
            fileName: "README.md",
            filePath: "README.md",
            status: "added",
          },
        ],
      });
    }

    // attach repository to user document for quick lookups
    await User.findByIdAndUpdate(owner, {
      $addToSet: { repositories: savedRepository._id },
    });

    res.status(201).json({
      success: true,
      data: savedRepository,
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Repository name already exists",
      });
    }

    console.error("Create Repository Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ===================================
// GET ALL REPOSITORIES (public only)
// ===================================
async function getAllRepository(req, res) {
  try {
    // only return public repositories here
    const repositories = await Repository.find({ visibility: true })
      .populate("owner", "username email")
      .populate("issues");

    res.status(200).json({
      success: true,
      data: repositories,
    });

  } catch (error) {
    console.error("Get All Repository Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ===================================
// FETCH REPOSITORY BY ID (honours visibility)
// ===================================
async function fetchRepositoryById(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository ID",
      });
    }

    const repository = await Repository.findById(id)
      .populate("owner", "username email")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    if (repository.visibility === false) {
      if (!hasWriteAccess(repository, req.user?.id)) {
        return res.status(404).json({
          success: false,
          message: "Repository not found",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: repository,
    });

  } catch (error) {
    console.error("Fetch Repository By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ===================================
// FETCH REPOSITORY BY NAME
// ===================================
async function fetchRepositoryByName(req, res) {
  const { name } = req.params;

  try {
    const repository = await Repository.findOne({ name })
      .populate("owner", "username email")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    if (repository.visibility === false) {
      const userId = req.user?.id;
      const isOwner =
        userId && repository.owner?.toString?.() === userId.toString();
      const isCollaborator =
        userId &&
        Array.isArray(repository.collaborators) &&
        repository.collaborators.some((c) => c.toString() === userId.toString());

      if (!isOwner && !isCollaborator) {
        return res.status(404).json({
          success: false,
          message: "Repository not found",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: repository,
    });

  } catch (error) {
    console.error("Fetch Repository By Name Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ===================================
// SEARCH REPOSITORIES (by name, public only)
// ===================================
async function searchRepositories(req, res) {
  const { term } = req.params;

  try {
    const regex = new RegExp(term, "i");

    const repositories = await Repository.find({
      visibility: true,
      name: { $regex: regex },
    })
      .populate("owner", "username email")
      .populate("issues");

    res.status(200).json({
      success: true,
      data: repositories,
    });
  } catch (error) {
    console.error("Search Repositories Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ===================================
// FETCH REPOSITORIES BY CURRENT USER
// ===================================
async function fetchRepositoriesByCurrentUser(req, res) {
  const { userId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    } 

    if (req.user?.id?.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const repositories = await Repository.find({ owner: userId });

    res.status(200).json({
      success: true,
      data: repositories,
    });

  } catch (error) {
    console.error("Fetch Repositories By Current User Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

async function fetchPublicRepositoriesByUser(req, res) {
  const { userId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const repositories = await Repository.find({
      owner: userId,
      visibility: true,
    });
    return res.status(200).json({ success: true, data: repositories });
  } catch (error) {
    console.error("Fetch Public Repositories Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ===================================
// UPDATE REPOSITORY BY ID
// ===================================
async function updateRepositoryByID(req, res) {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository ID",
      });
    }

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    if (!hasWriteAccess(repository, req.user?.id)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }
    if (updates.owner && updates.owner !== repository.owner.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot change repository owner directly",
      });
    }

    // Hardening check: Avoid overriding owner and collaborators generically
    delete updates.owner;
    delete updates.collaborators;
    delete updates.forkedFrom;

    Object.assign(repository, updates);
    const updatedRepository = await repository.save();

    res.status(200).json({
      success: true,
      data: updatedRepository,
    });

  } catch (error) {
    console.error("Update Repository Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ===================================
// TOGGLE VISIBILITY
// ===================================
async function toggelVisibilityByID(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository ID",
      });
    }

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    if (!hasWriteAccess(repository, req.user?.id)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    repository.visibility = !repository.visibility;
    await repository.save();

    res.status(200).json({
      success: true,
      message: `Repository is now ${
        repository.visibility ? "Public" : "Private"
      }`,
      data: repository,
    });

  } catch (error) {
    console.error("Toggle Visibility Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ===================================
// DELETE REPOSITORY
// ===================================
async function deleteRepositoryByID(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository ID",
      });
    }

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    if (!hasWriteAccess(repository, req.user?.id)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    await Repository.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Repository deleted successfully",
    });

  } catch (error) {
    console.error("Delete Repository Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ===================================
// TOGGLE STAR REPOSITORY
// ===================================
async function toggleStarRepository(req,res){

  const { id } = req.params;
  const { userId } = req.body;

  try{

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success:false,
        message:"Invalid repository ID"
      });
    }

    if(!mongoose.Types.ObjectId.isValid(userId)){
      return res.status(400).json({
        success:false,
        message:"Invalid user ID"
      });
    }

    const repository = await Repository.findById(id);

    if(!repository){
      return res.status(404).json({
        success:false,
        message:"Repository not found"
      });
    }

    const alreadyStarred = repository.stars.includes(userId);

    if(alreadyStarred){

      repository.stars = repository.stars.filter(
        star => star.toString() !== userId
      );

    }else{

      repository.stars.push(userId);

    }

    await repository.save();

    res.status(200).json({
      success:true,
      starred:!alreadyStarred,
      starsCount:repository.stars.length
    });

  }catch(error){

    console.error("Toggle Star Error:",error);

    res.status(500).json({
      success:false,
      message:"Internal Server Error"
    });

  }

}

// ===================================
// TOGGLE WATCH REPOSITORY
// ===================================
async function toggleWatchRepository(req, res) {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    const alreadyWatching = repository.watchers.includes(userId);

    if (alreadyWatching) {
      repository.watchers = repository.watchers.filter(
        (watcher) => watcher.toString() !== userId,
      );
    } else {
      repository.watchers.push(userId);
    }

    await repository.save();

    res.status(200).json({
      success: true,
      watching: !alreadyWatching,
      watchersCount: repository.watchers.length,
    });
  } catch (error) {
    console.error("Toggle Watch Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ===================================
// FETCH STARRED REPOSITORIES
// ===================================
// async function fetchStarredRepositories(req,res){

//   const { userId } = req.params;

//   try{

//     if(!mongoose.Types.ObjectId.isValid(userId)){
//       return res.status(400).json({
//         success:false,
//         message:"Invalid user ID"
//       });
//     }

//     const repositories = await Repository.find({
//       stars:userId
//     }).populate("owner","username email");

//     res.status(200).json({
//       success:true,
//       data:repositories
//     });

//   }catch(error){

//     console.error("Fetch Starred Repo Error:",error);

//     res.status(500).json({
//       success:false,
//       message:"Internal Server Error"
//     });

//   }

// }


// ===================================
// GET STARRED REPOSITORIES
// ===================================
async function getStarredRepositories(req, res) {

  const { userId } = req.params;

  try {

    const repositories = await Repository.find({
      stars: userId
    })
      .populate("owner", "username email")
      .populate("issues");

    res.status(200).json({
      success: true,
      data: repositories
    });

  } catch (error) {

    console.error("Get Starred Repositories Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });

  }
}

// ===================================
// FORK REPOSITORY (snapshot of latest commit)
// ===================================
async function forkRepository(req, res) {
  const { id: sourceId } = req.params;
  const ownerId = req.user.id;
  const requestedName = req.body?.name;

  try {
    if (!mongoose.Types.ObjectId.isValid(sourceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository ID",
      });
    }

    const source = await Repository.findById(sourceId);
    if (!source) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    if (source.visibility === false) {
      const isOwner = source.owner.toString() === ownerId;
      const isCollab =
        Array.isArray(source.collaborators) &&
        source.collaborators.some((c) => c.toString() === ownerId);
      if (!isOwner && !isCollab) {
        return res.status(404).json({
          success: false,
          message: "Repository not found",
        });
      }
    }

    const rawBase =
      (requestedName && String(requestedName).trim()) || `${source.name}-fork`;
    let baseName = rawBase.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 100);
    if (!baseName) baseName = `${source.name}-fork`;

    let name = baseName;
    let savedRepo = null;
    let lastErr = null;

    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const newRepo = new Repository({
          name,
          description: source.description,
          content: source.content,
          visibility: true,
          owner: ownerId,
          forkedFrom: sourceId,
        });
        savedRepo = await newRepo.save();
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        if (e.code === 11000) {
          name = `${baseName}-${Math.random().toString(36).slice(2, 8)}`;
          continue;
        }
        throw e;
      }
    }

    if (!savedRepo) {
      return res.status(400).json({
        success: false,
        message:
          lastErr?.code === 11000
            ? "Could not find an available repository name"
            : "Could not create fork",
      });
    }

    await User.findByIdAndUpdate(ownerId, {
      $addToSet: { repositories: savedRepo._id },
    });

    const latest = await Commit.findOne({ repository: sourceId }).sort({
      createdAt: -1,
    });

    if (latest && latest.files?.length) {
      const filesCopy = latest.files.map((f) => ({
        fileName: f.fileName,
        filePath: f.filePath,
        url: f.url,
      }));

      await new Commit({
        repository: savedRepo._id,
        commitMessage: `Fork snapshot from ${source.name}`,
        commitId: uuidv4(),
        files: filesCopy,
      }).save();
    }

    const populated = await Repository.findById(savedRepo._id)
      .populate("owner", "username email")
      .populate("issues");

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error("Fork Repository Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ===================================
// COLLABORATOR MANAGEMENT
// ===================================

async function getCollaborators(req, res) {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid repo ID" });
    const repository = await Repository.findById(id).populate("owner", "username email").populate("collaborators", "username email avatarUrl");
    if (!repository) return res.status(404).json({ success: false, message: "Not found" });

    const isOwner = req.user?.id && repository.owner?._id?.toString() === req.user.id.toString();
    if (!isOwner) return res.status(403).json({ success: false, message: "Only the owner can view collaborators" });

    res.status(200).json({ success: true, data: { owner: repository.owner, collaborators: repository.collaborators } });
  } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
}

async function addCollaborator(req, res) {
  const { id } = req.params;
  const { userId, usernameOrEmail } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false });
    const repository = await Repository.findById(id);
    if (!repository) return res.status(404).json({ success: false });

    if (repository.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Only the owner can add" });

    let targetUser = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) targetUser = await User.findById(userId);
    else if (usernameOrEmail) targetUser = await User.findOne({ $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }] });

    if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });
    if (targetUser._id.toString() === repository.owner.toString()) return res.status(400).json({ success: false, message: "Owner cannot be collab" });
    if (repository.collaborators.includes(targetUser._id)) return res.status(400).json({ success: false, message: "Already a collab" });

    repository.collaborators.push(targetUser._id);
    await repository.save();
    res.status(200).json({ success: true, message: "Added successfully" });
  } catch (error) { res.status(500).json({ success: false }); }
}

async function removeCollaborator(req, res) {
  const { id, userId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false });
    const repository = await Repository.findById(id);
    if (!repository) return res.status(404).json({ success: false });
    if (repository.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Only the owner can remove" });

    repository.collaborators = repository.collaborators.filter(c => c.toString() !== userId);
    await repository.save();
    res.status(200).json({ success: true, message: "Removed successfully" });
  } catch (error) { res.status(500).json({ success: false }); }
}

module.exports = {
  createRepository,
  getAllRepository,
  fetchRepositoryById,
  fetchRepositoryByName,
  searchRepositories,
  fetchRepositoriesByCurrentUser,
  fetchPublicRepositoriesByUser,
  updateRepositoryByID,
  toggelVisibilityByID,
  deleteRepositoryByID,
  toggleStarRepository,
  toggleWatchRepository,
  // fetchStarredRepositories,
  getStarredRepositories,
  forkRepository,
  getCollaborators,
  addCollaborator,
  removeCollaborator
};