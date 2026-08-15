const mongoose = require("mongoose");
const { GROUP_NAME_MAX_LENGTH, GROUP_DESCRIPTION_MAX_LENGTH } = require("../utils/limits");

/** A group. organizerId is whoever created it. */
const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: GROUP_NAME_MAX_LENGTH },
    description: { type: String, trim: true, maxlength: GROUP_DESCRIPTION_MAX_LENGTH, default: "" },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);