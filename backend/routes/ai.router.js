const express = require("express");
const { chat, getHistory, explainCode } = require("../controllers/aiController");

const aiRouter = express.Router();

aiRouter.post("/chat", chat);
aiRouter.get("/chat/history/:userId", getHistory);
aiRouter.post("/explain", explainCode);

module.exports = aiRouter;
