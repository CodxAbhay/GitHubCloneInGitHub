const fs = require('fs').promises;
const path = require('path');
const {s3, s3_bucket} = require('../config/aws_config.js');




async function pushRepo() {
    const repoPath = path.resolve(process.cwd(), ".AbhayGit");
    const commitsPath = path.join(repoPath, "commits");

    try {
        const commitDirs = await fs.readdir(commitsPath);   
        for (const file of commitDirs) {
            const filePath = path.join(commitsPath, file);
            const fileContent = await fs.readdir(filePath);

            for (const item of fileContent) {
                const itemPath = path.join(filePath, item);
                const itemData = await fs.readFile(itemPath);
                const params = {
                    Bucket: s3_bucket,
                    Key: `commits/${file}/${item}`,
                    Body: itemData
                };
                await s3.upload(params).promise();
                console.log(`Uploaded ${item} to S3 bucket ${s3_bucket}`);
            }
        }
    } catch (error) {
        console.error('Error pushing to remote repository:', error);
    }
}


module.exports = { pushRepo };