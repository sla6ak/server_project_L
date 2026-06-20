import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ChatSchema = new Schema({
  id: {
    type: String,
    required: true,
    default: () => Math.random().toString(36).substring(7),
  },
  sender: { type: String, required: [true, "sender is required"] },
  text: { type: String, required: [true, "message text is required"] },
  timestamp: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: "public" }, // public или private
});

const ChatModel = model("Chat", ChatSchema);
export default ChatModel;
