const axios = require("axios");
const crypto = require("crypto");
const { loadConfig, saveConfig } = require("./config");

async function login({ backendUrl, email, password }) {
  const safeUrl = backendUrl.replace(/\/+$/, '');
  const res = await axios.post(`${safeUrl}/login`, { email, password });
  return res.data;
}

function hashPat(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createPat({ backendUrl, jwtToken, name }) {
  const safeUrl = backendUrl.replace(/\/+$/, '');
  const res = await axios.post(
    `${safeUrl}/user/pat`,
    { name },
    { headers: { Authorization: `Bearer ${jwtToken}` } },
  );
  return res.data;
}

function setDefaultBackend(backendUrl) {
  const cfg = loadConfig();
  saveConfig({ ...cfg, backendUrl });
}

function setDefaultToken(token) {
  const cfg = loadConfig();
  saveConfig({ ...cfg, token });
}

module.exports = {
  login,
  createPat,
  setDefaultBackend,
  setDefaultToken,
  hashPat,
};

