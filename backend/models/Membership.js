const mongoose = require("mongoose");

/** Join table linking a User to a Group with their role in it. */
const membershipSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roleInGroup: { type: String, enum: ["organizer", "member"], required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

membershipSchema.index({ groupId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Membership", membershipSchema);