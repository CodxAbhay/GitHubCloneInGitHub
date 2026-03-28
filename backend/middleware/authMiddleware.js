const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");
dotenv.config();

const { MongoClient } = require("mongodb");
const crypto = require("crypto");

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

function authMiddleware(req, res, next) {

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided"
    });
  }

  try {

    const raw = token.split(" ")[1];

    // PAT support for deployed CLI pushing
    if (raw && raw.startsWith("pat_")) {
      return (async () => {
        try {
          const client = await connectClient();
          const db = client.db("githubclone");
          const users = db.collection("users");
          const tokenHash = hashToken(raw);

          const user = await users.findOne({
            patTokens: {
              $elemMatch: { tokenHash, revokedAt: null },
            },
          });

          if (!user) {
            return res.status(401).json({
              success: false,
              message: "Invalid token",
            });
          }

          // best-effort update lastUsedAt
          await users.updateOne(
            { _id: user._id, "patTokens.tokenHash": tokenHash },
            { $set: { "patTokens.$.lastUsedAt": new Date() } },
          );

          req.user = { id: user._id.toString(), pat: true };
          next();
        } catch (e) {
          console.error("PAT auth error:", e);
          return res.status(401).json({
            success: false,
            message: "Invalid token",
          });
        }
      })();
    }

    const decoded = jwt.verify(raw, JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });

  }
}

module.exports = authMiddleware;