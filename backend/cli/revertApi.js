const axios = require("axios");
const { step, ok, err, dim } = require("./gitStyle");

async function revertApi({ backendUrl, repoId, token, commitId }) {
  if (!backendUrl) throw new Error("backendUrl is required");
  if (!repoId) throw new Error("repoId is required");
  if (!commitId) throw new Error("commitId is required");

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  step(`reverting ${repoId} to commit ${commitId} …`);

  const safeUrl = backendUrl.replace(/\/+$/, '');
  const res = await axios.post(
    `${safeUrl}/commit/revert/${repoId}`,
    { targetCommitId: commitId },
    { headers, timeout: 120000 },
  );

  const payload = res.data;
  if (!payload?.success) {
    throw new Error(payload?.message || "Failed to revert commit");
  }

  ok(`successfully reverted to commit ${commitId}`);
  dim(`  New branch head generated: ${payload.data?.commitId || "unknown"}`);
  
  return payload;
}

module.exports = { revertApi };
