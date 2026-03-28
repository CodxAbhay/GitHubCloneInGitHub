const mongoose = require("mongoose");
const { Schema } = mongoose;

const RepositorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
    },
    content: {
        type: String,
    },
    visibility: {
        type: Boolean,
        default: true, // public by default
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // list of collaborators that have write access
    collaborators: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    issues: [
        {
            type: Schema.Types.ObjectId,
            ref: "Issue",
        },
    ],
    stars: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    // users watching this repository for updates
    watchers: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    // optional: fork metadata
    forkedFrom: {
        type: Schema.Types.ObjectId,
        ref: "Repository",
    },
    defaultBranch: {
        type: String,
        default: "main",
    },
});

const Repository = mongoose.model("Repository", RepositorySchema);

module.exports = Repository;