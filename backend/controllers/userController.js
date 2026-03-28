const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

dotenv.config();

const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET_KEY;

let client;

// =============================
// MongoDB Connection (Singleton)
// =============================
async function connectClient() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");
  }
  return client;
}

// =============================
// SIGNUP
// =============================
async function signup(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const client = await connectClient();
    const db = client.db("githubclone");
    const users = db.collection("users");

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      email,
      password: hashedPassword,
      repositories: [],
      followedUsers: [],
      starredRepos: [],
      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    // Generate JWT
    const token = jwt.sign(
      { id: result.insertedId.toString(), email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      success: true,
      token,
      userId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// =============================
// LOGIN
// =============================
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const client = await connectClient();
    const db = client.db("githubclone");
    const users = db.collection("users");

    const user = await users.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      token,
      userId: user._id.toString(),
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// =============================
// GET ALL USERS
// =============================
async function getAllUsers(req, res) {
  try {
    const client = await connectClient();
    const db = client.db("githubclone");
    const users = db.collection("users");

    const allUsers = await users
      .find({}, { projection: { password: 0 } })
      .toArray();

    res.json({
      success: true,
      data: allUsers,
    });
  } catch (error) {
    console.error("Fetch Users Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// =============================
// GET USER PROFILE
// =============================
async function getUserProfile(req, res) {
  try {
    const { id } = req.params;

    const client = await connectClient();
    const db = client.db("githubclone");
    const users = db.collection("users");

    const user = await users.findOne(
      { _id: new ObjectId(id) }, // convert string ID to ObjectId
      { projection: { password: 0 } }, // exclude password from result
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// =============================
// UPDATE USER PROFILE
// =============================
async function updateUserProfile(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const client = await connectClient();
    const db = client.db("githubclone");
    const users = db.collection("users");

    delete updates.password; // prevent password update here

    const result = await users.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated",
    });
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// =============================
// DELETE USER PROFILE
// =============================
async function deleteUserProfile(req, res) {
  try {
    const { id } = req.params;

    const client = await connectClient();
    const db = client.db("githubclone");
    const users = db.collection("users");

    const result = await users.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted",
    });
  } catch (error) {
    console.error("Delete Profile Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// =============================
// FOLLOW A USER
// =============================
async function followUser(req, res) {
  try {
    const { id: targetUserId } = req.params; // user to follow
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const client = await connectClient();
    const db = client.db("githubclone");
    const users = db.collection("users");

    const target = await users.findOne({ _id: new ObjectId(targetUserId) });
    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User to follow not found",
      });
    }

    await users.updateOne(
      { _id: new ObjectId(currentUserId) },
      { $addToSet: { followedUsers: new ObjectId(targetUserId) } },
    );

    res.json({
      success: true,
      message: "User followed",
    });
  } catch (error) {
    console.error("Follow User Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// =============================
// UNFOLLOW A USER
// =============================
async function unfollowUser(req, res) {
  try {
    const { id: targetUserId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const client = await connectClient();
    const db = client.db("githubclone");
    const users = db.collection("users");

    await users.updateOne(
      { _id: new ObjectId(currentUserId) },
      { $pull: { followedUsers: new ObjectId(targetUserId) } },
    );

    res.json({
      success: true,
      message: "User unfollowed",
    });
  } catch (error) {
    console.error("Unfollow User Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// =============================
// GET FOLLOWING / FOLLOWERS
// =============================
async function getFollowing(req, res) {
  try {
    const { id } = req.params;

    const client = await connectClient();
    const db = client.db("githubclone");
    const users = db.collection("users");

    const user = await users.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const following = await users
      .find(
        { _id: { $in: user.followedUsers || [] } },
        { projection: { password: 0 } },
      )
      .toArray();

    res.json({
      success: true,
      data: following,
    });
  } catch (error) {
    console.error("Get Following Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

async function getFollowers(req, res) {
  try {
    const { id } = req.params;

    const client = await connectClient();
    const db = client.db("githubclone");
    const users = db.collection("users");

    const followers = await users
      .find(
        { followedUsers: new ObjectId(id) },
        { projection: { password: 0 } },
      )
      .toArray();

    res.json({
      success: true,
      data: followers,
    });
  } catch (error) {
    console.error("Get Followers Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// =============================
// PERSONAL ACCESS TOKENS (PAT)
// =============================
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createPat(req, res) {
  try {
    const currentUserId = req.user?.id;
    const { name } = req.body;
    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!name || !String(name).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Token name is required" });
    }

    const tokenPlain = `pat_${crypto.randomBytes(24).toString("hex")}`;
    const tokenHash = hashToken(tokenPlain);

    const client = await connectClient();
    const db = client.db("githubclone");
    const users = db.collection("users");

    const pat = {
      id: uuidv4(),
      name: String(name).trim(),
      tokenHash,
      createdAt: new Date(),
      lastUsedAt: null,
      revokedAt: null,
    };

    await users.updateOne(
      { _id: new ObjectId(currentUserId) },
      { $push: { patTokens: pat } },
    );

    return res.json({
      success: true,
      token: tokenPlain,
      meta: { id: pat.id, name: pat.name, createdAt: pat.createdAt },
    });
  } catch (e) {
    console.error("Create PAT Error:", e);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function listPats(req, res) {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const client = await connectClient();
    const db = client.db("githubclone");
    const users = db.collection("users");

    const user = await users.findOne(
      { _id: new ObjectId(currentUserId) },
      { projection: { patTokens: 1 } },
    );

    const tokens = (user?.patTokens || []).map((t) => ({
      id: t.id,
      name: t.name,
      createdAt: t.createdAt,
      lastUsedAt: t.lastUsedAt,
      revokedAt: t.revokedAt,
    }));

    return res.json({ success: true, data: tokens });
  } catch (e) {
    console.error("List PAT Error:", e);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function revokePat(req, res) {
  try {
    const currentUserId = req.user?.id;
    const { patId } = req.params;
    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!patId) {
      return res.status(400).json({ success: false, message: "patId required" });
    }

    const client = await connectClient();
    const db = client.db("githubclone");
    const users = db.collection("users");

    const now = new Date();
    const result = await users.updateOne(
      { _id: new ObjectId(currentUserId), "patTokens.id": patId },
      { $set: { "patTokens.$.revokedAt": now } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "PAT not found" });
    }

    return res.json({ success: true, message: "PAT revoked" });
  } catch (e) {
    console.error("Revoke PAT Error:", e);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

module.exports = {
  signup,
  login,
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  createPat,
  listPats,
  revokePat,
};
