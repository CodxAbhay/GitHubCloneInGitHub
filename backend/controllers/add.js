const fs = require('fs').promises;
const path = require('path');

async function addRepo(filePath) {
    // const filePath = path.resolve(process.cwd(), process.argv[3]); // Get the file path from command line arguments
    const repoPath = path.resolve(process.cwd(), ".AbhayGit");
    const stagingPath = path.join(repoPath, "staging");

    try {
        await fs.mkdir(stagingPath, { recursive: true });
        const fileName = path.basename(filePath);
        await fs.copyFile(filePath, path.join(stagingPath, fileName));
        console.log(`File ${fileName} added to staging area`);
    } catch (err) {
        console.error("Error adding file to staging area:", err.message);
    }
}
module.exports = { addRepo };