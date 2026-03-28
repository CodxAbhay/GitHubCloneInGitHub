const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { step, ok, err, dim } = require("./gitStyle");

async function pullApi({ backendUrl, repoId, token, destPath }) {
  if (!backendUrl) throw new Error("backendUrl is required");
  if (!repoId) throw new Error("repoId is required");

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  step(`fetching from ${backendUrl} …`);
  dim(`  repository: ${repoId}`);

  const manifestRes = await axios.get(
    `${backendUrl}/repo/pull/${repoId}/manifest`,
    { headers, timeout: 120000 },
  );

  const payload = manifestRes.data;
  if (!payload?.success) {
    throw new Error(payload?.message || "Failed to load manifest");
  }

  const { files, commitId, commitMessage } = payload.data || {};
  const list = files || [];

  if (!list.length) {
    ok("nothing to pull (empty repository).");
    return { files: 0, commitId, commitMessage };
  }

  step(`receiving objects: ${list.length}, done.`);
  const root = path.resolve(process.cwd(), destPath || ".");

  for (const f of list) {
    const rel = (f.filePath || f.fileName || "").replace(/^[/\\]+/, "");
    if (!rel) continue;
    const full = path.join(root, rel.replaceAll("/", path.sep));
    fs.mkdirSync(path.dirname(full), { recursive: true });

    if (!f.url || typeof f.url !== "string") {
      err(`Missing or invalid URL for file: ${rel} | URL: ${f.url}`);
      continue;
    }
    
    // Optional debug if needed
    // console.log("Fetching: " + f.url);

    const fileRes = await axios.get(f.url, {
      responseType: "arraybuffer",
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    fs.writeFileSync(full, Buffer.from(fileRes.data));
  }

  ok(`updated ${list.length} path(s).`);
  dim(`  HEAD -> ${commitId || "unknown"} | ${commitMessage || ""}`);
  return { files: list.length, commitId, commitMessage };
}

module.exports = { pullApi };
