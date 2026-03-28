const fs = require("fs").promises;
const path = require("path");
const { s3, s3_bucket } = require("../config/aws_config");

async function pullRepo() {
  const repoPath = path.resolve(process.cwd(), ".AbhayGit");
  const commitsPath = path.join(repoPath, "commits");

  try {
    // Get the list of objects in the S3 bucket
    const data = await s3.listObjectsV2({ Bucket: s3_bucket, Prefix: "commits/" }).promise();
    const objects = data.Contents; // Array of objects in the bucket

    for (const obj of objects) {
        const key = obj.Key;
        const commitDir = path.join(commitsPath, path.dirname(key).split("/").pop());

        await fs.mkdir(commitDir, { recursive: true });
        const params = { Bucket: s3_bucket, Key: key };

        const fileData = await s3.getObject(params).promise();
        const filePath = path.join(repoPath, key);

        await fs.writeFile(filePath, fileData.Body);
    }
    console.log("Pull operation completed successfully.");
  } catch (err) {
    console.error("Error pulling from remote repository:", err);
  }
}
module.exports = { pullRepo };
