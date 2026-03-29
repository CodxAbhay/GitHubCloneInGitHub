#!/usr/bin/env node

// =========================================================
// AntiGitHUB CLI - by Abhay Pratap Verma
// Install globally: npm install -g antigithub-cli
// Usage: antigithub --help
// =========================================================

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const { login, createPat } = require("./lib/auth");
const { loadConfig, saveConfig, CONFIG_PATH } = require("./lib/config");
const { pushApi } = require("./lib/pushApi");
const { pullApi } = require("./lib/pullApi");

const DEFAULT_BACKEND = "https://antigithub-backend.onrender.com";

yargs(hideBin(process.argv))
  .scriptName("antigithub")
  .usage("Usage: $0 <command> [options]")

  // ── LOGIN ──────────────────────────────────────────────
  .command(
    "login",
    "Login to AntiGitHUB and save your token locally",
    (y) =>
      y
        .option("email",    { type: "string", demandOption: true, describe: "Your account email" })
        .option("password", { type: "string", demandOption: true, describe: "Your account password" })
        .option("backend",  { type: "string", default: DEFAULT_BACKEND, describe: "Backend API URL" }),
    async (argv) => {
      try {
        const data = await login({ backendUrl: argv.backend, email: argv.email, password: argv.password });
        if (!data?.success || !data?.token) {
          console.error("Login failed:", data?.message || "Unknown error");
          process.exit(1);
        }
        const cfg = loadConfig();
        saveConfig({ ...cfg, backendUrl: argv.backend, token: data.token, userId: data.userId });
        console.log("\x1b[32m✓\x1b[0m Logged in successfully! Token saved to", CONFIG_PATH);
      } catch (e) {
        console.error("\x1b[31merror:\x1b[0m", e.response?.data?.message || e.message);
        process.exit(1);
      }
    }
  )

  // ── PAT:CREATE ────────────────────────────────────────
  .command(
    "pat:create",
    "Create a Personal Access Token (PAT) for pushing code",
    (y) =>
      y
        .option("name",    { type: "string", demandOption: true, describe: "A name for this token (e.g. my-laptop)" })
        .option("backend", { type: "string", describe: "Backend API URL (uses saved config if not provided)" }),
    async (argv) => {
      try {
        const cfg = loadConfig();
        const backendUrl = argv.backend || cfg.backendUrl || DEFAULT_BACKEND;
        const jwtToken = cfg.token;
        if (!jwtToken) {
          console.error('\x1b[31merror:\x1b[0m No token found. Please run: antigithub login --email <email> --password <password>');
          process.exit(1);
        }
        const data = await createPat({ backendUrl, jwtToken, name: argv.name });
        if (!data?.success) {
          console.error("PAT creation failed:", data?.message || "Unknown error");
          process.exit(1);
        }
        console.log("\n\x1b[32m✓\x1b[0m PAT created successfully!");
        console.log("\x1b[33mYour token (copy it now, it won't be shown again):\x1b[0m");
        console.log("\n  " + data.token + "\n");
        console.log("Use it with: \x1b[36mantigithub push --repo <repoId> --token " + data.token + "\x1b[0m");
      } catch (e) {
        console.error("\x1b[31merror:\x1b[0m", e.response?.data?.message || e.message);
        process.exit(1);
      }
    }
  )

  // ── PUSH ──────────────────────────────────────────────
  .command(
    "push",
    "Push the current folder to a repository",
    (y) =>
      y
        .option("repo",    { type: "string", demandOption: true, describe: "Repository ID (from the repo page sidebar)" })
        .option("token",   { type: "string", describe: "JWT or PAT token (uses saved config if not provided)" })
        .option("message", { type: "string", default: "Update files", describe: "Commit message" })
        .option("path",    { type: "string", default: ".", describe: "Folder path to push (default: current directory)" })
        .option("backend", { type: "string", describe: "Backend API URL (uses saved config if not provided)" })
        .option("yes",     { alias: "y", type: "boolean", default: false, describe: "Skip confirmation prompt" })
        .example("$0 push --repo abc123", "Push current folder (shows confirmation)")
        .example("$0 push --repo abc123 --path ./my-project --message \"Initial commit\"", "Push a specific subfolder")
        .example("$0 push --repo abc123 --yes", "Push without confirmation prompt"),
    async (argv) => {
      try {
        const cfg = loadConfig();
        const backendUrl = argv.backend || cfg.backendUrl || DEFAULT_BACKEND;
        const token = argv.token || cfg.token;
        if (!token) {
          console.error('\x1b[31merror:\x1b[0m No token. Create one with: antigithub pat:create --name mytoken');
          process.exit(1);
        }
        await pushApi({ backendUrl, repoId: argv.repo, token, message: argv.message, rootPath: argv.path, yes: argv.yes });
      } catch (e) {
        console.error("\x1b[31merror:\x1b[0m", e.response?.data?.message || e.message);
        process.exit(1);
      }
    }
  )

  // ── PULL ──────────────────────────────────────────────
  .command(
    "pull",
    "Pull the latest code snapshot from a repository",
    (y) =>
      y
        .option("repo",    { type: "string", demandOption: true, describe: "Repository ID" })
        .option("token",   { type: "string", describe: "JWT or PAT token (needed for private repos)" })
        .option("path",    { type: "string", default: ".", describe: "Destination folder (default: current directory)" })
        .option("backend", { type: "string", describe: "Backend API URL" }),
    async (argv) => {
      try {
        const cfg = loadConfig();
        const backendUrl = argv.backend || cfg.backendUrl || DEFAULT_BACKEND;
        const token = argv.token || cfg.token;
        await pullApi({ backendUrl, repoId: argv.repo, token, destPath: argv.path });
      } catch (e) {
        console.error("\x1b[31merror:\x1b[0m", e.response?.data?.message || e.message);
        process.exit(1);
      }
    }
  )

  // ── WHOAMI ───────────────────────────────────────────
  .command(
    "whoami",
    "Show currently logged-in account info",
    () => {},
    () => {
      const cfg = loadConfig();
      if (!cfg.token) {
        console.log("Not logged in. Run: antigithub login --email <email> --password <password>");
      } else {
        console.log("Backend:", cfg.backendUrl || DEFAULT_BACKEND);
        console.log("User ID:", cfg.userId || "unknown");
        console.log("Token:  ", cfg.token.slice(0, 20) + "...");
      }
    }
  )

  // ── LOGOUT ───────────────────────────────────────────
  .command(
    "logout",
    "Remove locally saved login token",
    () => {},
    () => {
      saveConfig({});
      console.log("\x1b[32m✓\x1b[0m Logged out. Config cleared.");
    }
  )

  .demandCommand(1, "\nPlease provide a command. Run `antigithub --help` to see available commands.\n")
  .recommendCommands()
  .strict()
  .help()
  .alias("h", "help")
  .alias("v", "version")
  .argv;
