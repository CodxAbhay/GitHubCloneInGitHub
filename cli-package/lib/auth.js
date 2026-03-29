const axios = require("axios");

async function login({ backendUrl, email, password }) {
  const safeUrl = backendUrl.replace(/\/+$/, "");
  const res = await axios.post(`${safeUrl}/login`, { email, password });
  return res.data;
}

async function createPat({ backendUrl, jwtToken, name }) {
  const safeUrl = backendUrl.replace(/\/+$/, "");
  const res = await axios.post(
    `${safeUrl}/user/pat`,
    { name },
    { headers: { Authorization: `Bearer ${jwtToken}` } }
  );
  return res.data;
}

module.exports = { login, createPat };
