const mongoose = require("mongoose");
const { Schema } = mongoose;


const commitSchema = new mongoose.Schema({

  repository: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repository",
    required: true
  },

  commitMessage: {
    type: String,
    required: true
  },

  commitId: {
    type: String,
    required: true
  },

  files: [
    {
      fileName: String,
      filePath: String,
      url: String
    }
  ],
  changedFiles: [
    {
      fileName: String,
      filePath: String,
      status: {
        type: String,
        enum: ["added", "modified", "deleted", "reverted"],
        default: "modified",
      },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }

});


const Commit = mongoose.model("Commit",commitSchema);

module.exports = Commit;