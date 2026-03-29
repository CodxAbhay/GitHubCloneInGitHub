const fs = require("fs");
const path = require("path");
const axios = require("axios");
const readline = require("readline");
const FormData = require("form-data");
const { step, ok, warn, err, dim } = require("./gitStyle");

const IGNORE_PREFIXES = [".git/", "node_modules/", "dist/", "build/", ".antigravity/"];
const IGNORE_FILES = [".env", ".env.local", ".env.production"];

function shouldIgnore(relPath) {
  const p = relPath.replaceAll("\\", "/");
  if (IGNORE_PREFIXES.some((ig) => p.startsWith(ig))) return true;
  if (IGNORE_FILES.some((ig) => p === ig)) return true;
  return false;
}

function walkFiles(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const cur = stack.pop();
    for (const e of fs.readdirSync(cur, { withFileTypes: true })) {
      const abs = path.join(cur, e.name);
      const rel = path.relative(rootDir, abs).replaceAll("\\", "/");
      if (shouldIgnore(rel)) continue;
      if (e.isDirectory()) stack.push(abs);
      else if (e.isFile()) out.push({ abs, rel });
    }
  }
  return out;
}

function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function pushApi({ backendUrl, repoId, token, message, rootPath, yes }) {
  if (!backendUrl) throw new Error("backendUrl is required");
  if (!repoId) throw new Error("repoId is required — get it from your repo page sidebar");
  if (!token) throw new Error("token is required — create one with: antigithub pat:create --name mytoken");

  const resolvedRoot = path.resolve(process.cwd(), rootPath || ".");
  const files = walkFiles(resolvedRoot);

  if (files.length === 0) throw new Error("No files found to push in: " + resolvedRoot);

  // ── Safety Limit ──────────────────────────────────────────────────
  const MAX_FILES_WITHOUT_CONFIRM = 50;
  const MAX_FILE_MB = 10;
  const MAX_TOTAL_MB = 50;

  let totalBytes = 0;
  for (const f of files) {
    const st = fs.statSync(f.abs);
    if (st.size > MAX_FILE_MB * 1024 * 1024) {
      err(`file exceeds ${MAX_FILE_MB} MB limit: ${f.rel}`);
      throw new Error(`File too large: ${f.rel}`);
    }
    totalBytes += st.size;
  }
  if (totalBytes > MAX_TOTAL_MB * 1024 * 1024) {
    throw new Error(`Total upload exceeds ${MAX_TOTAL_MB} MB per commit`);
  }

  // ── Confirmation Prompt ───────────────────────────────────────────
  if (!yes) {
    console.log("\n\x1b[33m⚠  About to push the following directory:\x1b[0m");
    console.log("   Path:     \x1b[36m" + resolvedRoot + "\x1b[0m");
    console.log("   Files:    \x1b[36m" + files.length + " file(s)\x1b[0m, " + (totalBytes / 1024).toFixed(1) + " KiB total");
    console.log("   Repo ID:  \x1b[36m" + repoId + "\x1b[0m");
    console.log("   Message:  " + (message || "Update files"));

    if (files.length <= 20) {
      console.log("\n\x1b[2m   Files to be pushed:\x1b[0m");
      files.forEach((f) => console.log("   \x1b[2m+\x1b[0m " + f.rel));
    } else {
      console.log("\n\x1b[2m   First 20 files (of " + files.length + "):\x1b[0m");
      files.slice(0, 20).forEach((f) => console.log("   \x1b[2m+\x1b[0m " + f.rel));
      console.log("   \x1b[2m... and " + (files.length - 20) + " more\x1b[0m");
    }

    if (files.length >= MAX_FILES_WITHOUT_CONFIRM) {
      console.log("\n\x1b[31m⚠  WARNING: You are about to push " + files.length + " files!");
      console.log("   Make sure you are inside the correct project folder.\x1b[0m");
      console.log("   Use \x1b[33m--path ./my-project\x1b[0m to specify a subfolder.\n");
    } else {
      console.log("");
    }

    const answer = await confirm("\x1b[33mProceed with push? (y/N): \x1b[0m");
    if (answer !== "y" && answer !== "yes") {
      console.log("\x1b[31mPush cancelled.\x1b[0m");
      process.exit(0);
    }
    console.log("");
  }

  // ── Upload ────────────────────────────────────────────────────────
  step("enumerating objects…");
  dim(`  ${files.length} object(s), ${(totalBytes / 1024).toFixed(1)} KiB`);

  const form = new FormData();
  form.append("repoId", repoId);
  form.append("message", message || "Update files");
  for (const f of files) {
    form.append("files", fs.createReadStream(f.abs), { filename: path.basename(f.rel) });
    form.append("paths", f.rel);
  }

  step("writing objects…");
  step(`counting objects: ${files.length}, done.`);

  const safeUrl = backendUrl.replace(/\/+$/, "");
  const res = await axios.post(`${safeUrl}/commit/create`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 600000,
  });

  if (res.data?.success && res.data?.data?.commitId) {
    ok(`branch 'main' -> ${String(res.data.data.commitId).slice(0, 12)}`);
    dim(`  ${files.length} file(s) changed, ${(totalBytes / 1024).toFixed(1)} KiB`);
  } else if (!res.data?.success) {
    warn(res.data?.message || "push completed with warnings");
  }
  return res.data;
}

module.exports = { pushApi };
