// models/Invitation.js
// Schema for group invitations.
// It stores who sent the invite, who it was sent to, the invite token,
// the current status, and when the invite expires.

const mongoose = require("mongoose");
const crypto = require("crypto");

const invitationSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "declined", "expired"], default: "pending" },
    token: { type: String, required: true, unique: true, default: () => crypto.randomBytes(24).toString("hex") },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // invite expires after 7 days
    },
  },
  { timestamps: true }
);

// This helps stop the same email from getting many pending invites for the same group.
invitationSchema.index(
  { groupId: 1, email: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

// Checks if the invitation is still pending but already past the expiry date.
invitationSchema.methods.isExpired = function () {
  return this.status === "pending" && this.expiresAt.getTime() < Date.now();
};

module.exports = mongoose.model("Invitation", invitationSchema);
