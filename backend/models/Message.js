const mongoose = require("mongoose");
const { MESSAGE_MAX_LENGTH } = require("../utils/limits");

/** A chat message. isRemoved is a soft delete, used when admin removes a reported message. */
const messageSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true, trim: true, minlength: 1, maxlength: MESSAGE_MAX_LENGTH },
  sentAt: { type: Date, default: Date.now },
  isRemoved: { type: Boolean, default: false },
});

messageSchema.index({ groupId: 1, sentAt: -1 });
module.exports = mongoose.model("Message", messageSchema);