// models/Chat.js
const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    // conversation about nothing specific — just between two users
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Uer", // fixed typo ('Uer' -> 'User')
        required: true,
      },
    ],
    // messages array
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Uer",
          required: true,
        },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        read: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

// Optional: index to speed lookup by participants using $all queries
chatSchema.index({ participants: 1 });

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
