const AWS = require('aws-sdk');
const dotenv = require('dotenv');

dotenv.config();


AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    region: process.env.AWS_REGION,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();
const s3_bucket = process.env.S3_BUCKET_NAME;

module.exports = {
    s3,
    s3_bucket
};
