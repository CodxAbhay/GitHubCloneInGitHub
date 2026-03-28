const fs = require('fs').promises;
const path = require('path');


async function initRepo() {
  const repoPath = path.resolve(process.cwd(), ".AbhayGit");  // Hidden directory for the repo
  const commitsPath = path.join(repoPath, "commits");  // Directory to store commits
  // const stagingPath = path.join(repoPath, 'staging');  // Directory for staging area

  try{
    // Create the main repo directory
    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(commitsPath, { recursive: true });

    await fs.writeFile(
      path.join(repoPath, 'config.json'), 
      JSON.stringify({bucket : process.env.S3_BUCKET}),
    );
    console.log('Initialized repository in', repoPath);
  }
  catch (err) {
    console.error('Error initializing repository:', err.message);
  }
  
}

module.exports = { initRepo };