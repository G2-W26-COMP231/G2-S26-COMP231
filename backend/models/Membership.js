const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roleInGroup: { type: String, enum: ["organizer", "member"], required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// A user can only have one membership record per group.
membershipSchema.index({ groupId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Membership", membershipSchema);