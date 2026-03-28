const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
    },
    // repositories owned by this user
    repositories: [
        {
            type: Schema.Types.ObjectId,
            ref: "Repository",
            default: [],
        },
    ],
    // users this user follows
    followedUsers: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: [],
        },
    ],
    // repositories this user has starred
    starRepos: [
        {
            type: Schema.Types.ObjectId,
            ref: "Repository",
            default: [],
        },
    ],
});

const User = mongoose.model("User", UserSchema);

module.exports = User;