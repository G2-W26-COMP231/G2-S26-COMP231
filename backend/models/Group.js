// models/Membership.js
// Matches ERD: groupId (FK), userId (FK), status, createdAt
const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "member", "co-host"],
      default: "pending",
      required: true,
    },
  },
  { timestamps: true } 
);

module.exports = mongoose.model("Membership", membershipSchema);