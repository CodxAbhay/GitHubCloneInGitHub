require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const commits = await mongoose.connection.db.collection('commits').find({}).sort({createdAt:-1}).limit(2).toArray();
    console.log(JSON.stringify(commits.map(c => ({ _id: c._id, files: c.files.slice(0, 2) })), null, 2));
    process.exit(0);
});
