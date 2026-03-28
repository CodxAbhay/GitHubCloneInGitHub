const fs = require('fs').promises;
const path = require('path');
const {v4: uuidv4} = require('uuid');
// import { v4 as uuidv4 } from "uuid";




async function commitRepo(message) {
    const repoPath = path.resolve(process.cwd(), ".AbhayGit");
    const stagingPath = path.join(repoPath, "staging");
    const commitsPath = path.join(repoPath, "commits");
    try {
        const files = await fs.readdir(stagingPath);
        if (files.length === 0) {
            console.log("No files to commit in the staging area.");
            return;
        }
        const commitId = uuidv4();
        const commitDir = path.join(commitsPath, commitId);
        await fs.mkdir(commitDir, { recursive: true });
        for (const file of files) {
            await fs.copyFile(
                path.join(stagingPath, file),
                path.join(commitDir, file)
            );
        }
        await fs.writeFile(
            path.join(commitDir, "commit.json"),
            JSON.stringify({message, timestamp: new Date().toISOString() })
            // Commit
        );
        // Clear the staging area
        for (const file of files) {
            await fs.unlink(path.join(stagingPath, file));
        }
        console.log(`Committed changes with ID: ${commitId}`);
    } catch (err) {
        console.error("Error committing changes:", err.message);
    }   
}
module.exports = { commitRepo }; 