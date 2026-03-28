const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { step, ok, warn, err, dim } = require("./gitStyle");

function shouldIgnore(relPath) {
  const p = relPath.replaceAll("\\", "/");
  if (p.startsWith(".git/")) return true;
  if (p.startsWith("node_modules/")) return true;
  if (p.startsWith("dist/")) return true;
  if (p.startsWith("build/")) return true;
  if (p.startsWith(".AbhayGit/")) return true;
  if (p.startsWith(".cursor/")) return true;
  if (p === ".env") return true;
  return false;
}

function walkFiles(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(cur, e.name);
      const rel = path.relative(rootDir, abs).replaceAll("\\", "/");
      if (shouldIgnore(rel)) continue;
      if (e.isDirectory()) {
        stack.push(abs);
      } else if (e.isFile()) {
        out.push({ abs, rel });
      }
    }
  }
  return out;
}

async function pushApi({ backendUrl, repoId, token, message, rootPath }) {
  if (!backendUrl) throw new Error("backendUrl is required");
  if (!repoId) throw new Error("repoId is required");
  if (!token) throw new Error("token is required");

  const maxFileMb = parseInt(
    process.env.MAX_UPLOAD_FILE_MB || "10",
    10,
  );
  const maxTotalMb = parseInt(
    process.env.MAX_UPLOAD_TOTAL_MB || "50",
    10,
  );

  const resolvedRoot = path.resolve(process.cwd(), rootPath || ".");
  const files = walkFiles(resolvedRoot);
  if (files.length === 0) throw new Error("No files found to push");

  step("enumerating objects…");
  let totalBytes = 0;
  for (const f of files) {
    const st = fs.statSync(f.abs);
    if (st.size > maxFileMb * 1024 * 1024) {
      err(
        `file exceeds limit (${maxFileMb} MB): ${f.rel}`,
      );
      throw new Error(
        `File too large: ${f.rel} (max ${maxFileMb} MB per file)`,
      );
    }
    totalBytes += st.size;
  }
  if (totalBytes > maxTotalMb * 1024 * 1024) {
    err(`total size exceeds ${maxTotalMb} MB for one commit`);
    throw new Error(
      `Total upload would exceed ${maxTotalMb} MB for one commit`,
    );
  }

  dim(`  ${files.length} object(s), ${(totalBytes / 1024).toFixed(1)} KiB`);

  const form = new FormData();
  form.append("repoId", repoId);
  form.append("message", message || "Update files");

  for (const f of files) {
    form.append("files", fs.createReadStream(f.abs), {
      filename: path.basename(f.rel),
    });
    form.append("paths", f.rel);
  }

  step("writing objects…");
  step(`counting objects: ${files.length}, done.`);

  const safeUrl = backendUrl.replace(/\/+$/, '');
  const res = await axios.post(`${safeUrl}/commit/create`, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${token}`,
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 600000,
  });

  if (res.data?.success && res.data?.data?.commitId) {
    ok(`branch 'main' -> ${String(res.data.data.commitId).slice(0, 12)}`);
    dim(
      `  ${files.length} file(s) changed, ${(totalBytes / 1024).toFixed(1)} KiB`,
    );
  } else if (!res.data?.success) {
    warn(res.data?.message || "push completed with warnings");
  }

  return res.data;
}

module.exports = { pushApi };

