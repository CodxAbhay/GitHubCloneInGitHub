const fs = require("fs");
const os = require("os");
const path = require("path");

const CONFIG_PATH = path.join(os.homedir(), ".antigithub-cli.json");

function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return {};
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8") || "{}");
  } catch {
    return {};
  }
}

function saveConfig(next) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), "utf8");
}

module.exports = { CONFIG_PATH, loadConfig, saveConfig };
