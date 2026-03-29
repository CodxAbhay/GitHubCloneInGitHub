const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { step, ok, err, warn, dim } = require("./gitStyle");

async function pullApi({ backendUrl, repoId, token, destPath }) {
  if (!backendUrl) throw new Error("backendUrl is required");
  if (!repoId) throw new Error("repoId is required");

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  step(`fetching from ${backendUrl} …`);
  dim(`  repository: ${repoId}`);

  const manifestRes = await axios.get(
    `${backendUrl}/repo/pull/${repoId}/manifest`,
    { headers, timeout: 120000 }
  );

  const payload = manifestRes.data;
  if (!payload?.success) throw new Error(payload?.message || "Failed to load manifest");

  const { files, commitId, commitMessage } = payload.data || {};
  const list = files || [];

  if (!list.length) {
    ok("nothing to pull (empty repository).");
    return { files: 0, commitId, commitMessage };
  }

  step(`receiving objects: ${list.length}, done.`);
  const root = path.resolve(process.cwd(), destPath || ".");

  let downloaded = 0;
  let skipped = 0;

  for (const f of list) {
    const rel = (f.filePath || f.fileName || "").replace(/^[/\\]+/, "");
    if (!rel) continue;
    const full = path.join(root, rel.replaceAll("/", path.sep));

    if (!f.url || typeof f.url !== "string" || !f.url.startsWith("http")) {
      warn(`skipping '${rel}' — URL is missing or expired (re-push this file to refresh it)`);
      skipped++;
      continue;
    }

    try {
      fs.mkdirSync(path.dirname(full), { recursive: true });
      const fileRes = await axios.get(f.url, {
        responseType: "arraybuffer",
        timeout: 120000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      fs.writeFileSync(full, Buffer.from(fileRes.data));
      downloaded++;
    } catch (e) {
      warn(`failed to download '${rel}' — ${e.message}`);
      skipped++;
    }
  }

  ok(`updated ${downloaded} path(s)${skipped > 0 ? `, skipped ${skipped} (missing/expired URLs)` : ""}.`);
  dim(`  HEAD -> ${commitId || "unknown"} | ${commitMessage || ""}`);

  if (skipped > 0) {
    console.log(
      "\n\x1b[33mNote:\x1b[0m Some files were skipped because their download URLs are missing or expired."
    );
    console.log(
      "  To fix: push these files again from your machine to refresh their URLs.\n"
    );
  }

  return { downloaded, skipped, commitId, commitMessage };
}

module.exports = { pullApi };
