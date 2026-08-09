const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * An invite to join a group, sent by email. Uses a random token so the
 * accept link can't be guessed. Expires after 7 days by default.
 */
const invitationSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "declined", "expired"], default: "pending" },
    token: { type: String, required: true, unique: true, default: () => crypto.randomBytes(24).toString("hex") },
    seenByInviter: { type: Boolean, default: false },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

invitationSchema.index(
  { groupId: 1, email: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

/**
 * Checks if a still-pending invite is past its expiry date.
 * @returns {boolean}
 */
invitationSchema.methods.isExpired = function () {
  return this.status === "pending" && this.expiresAt.getTime() < Date.now();
};

module.exports = mongoose.model("Invitation", invitationSchema);