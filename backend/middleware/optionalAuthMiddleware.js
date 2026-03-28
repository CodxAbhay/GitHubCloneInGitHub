const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");
const crypto = require("crypto");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

let client;
async function connectClient() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * If Authorization header is present and valid, sets req.user; otherwise continues.
 */
async function optionalAuthMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    return next();
  }

  try {
    const raw = auth.split(" ")[1];
    if (!raw) return next();

    if (raw.startsWith("pat_")) {
      const clientDb = await connectClient();
      const db = clientDb.db("githubclone");
      const users = db.collection("users");
      const tokenHash = hashToken(raw);
      const user = await users.findOne({
        patTokens: { $elemMatch: { tokenHash, revokedAt: null } },
      });
      if (!user) return next();
      req.user = { id: user._id.toString(), pat: true };
      return next();
    }

    const decoded = jwt.verify(raw, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch {
    return next();
  }
}

module.exports = optionalAuthMiddleware;
