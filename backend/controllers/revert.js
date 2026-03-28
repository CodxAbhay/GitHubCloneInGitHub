const fs = require("fs");
const path = require("path");

const {promisify} = require("util");
const readdir = promisify(fs.readdir);
const copyFile = promisify(fs.copyFile);


async function revertRepo(commitId) {
    const repoPath = path.resolve(process.cwd(), ".AbhayGit");
    const commitsPath = path.join(repoPath, "commits");
    
    try {
        const commitDirs = await readdir(commitsPath);
        if (!commitDirs.includes(commitId)) {
            console.error("Commit ID not found:", commitId);
            return;
        }
        const commitDir = path.join(commitsPath, commitId);
        const files = await readdir(commitDir);
        const parentDir = path.resolve(repoPath, "..");

        for (const file of files) {
            const srcPath = path.join(commitDir, file);  // Source file in the commit directory
            const destPath = path.join(parentDir, file);  // Destination file in the working directory where we want to revert
            await copyFile(srcPath, destPath); // Copy file from commit to working directory
            console.log(`Reverted ${file} to commit ${commitId}`);
        }

    }catch (error) {
        console.error("Error reverting to commit:", error);
    }
}
module.exports = { revertRepo };