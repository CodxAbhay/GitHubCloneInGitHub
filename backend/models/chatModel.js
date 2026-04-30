const mongoose = require("mongoose");
const { Schema } = mongoose;

const ChatSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    messages: [
        {
            role: {
                type: String,
                enum: ["user", "model", "system"],
                required: true,
            },
            content: {
                type: String,
                required: true,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

const Chat = mongoose.model("Chat", ChatSchema);

module.exports = Chat;
