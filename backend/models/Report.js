const mongoose = require("mongoose");
const { REPORT_REASON_MAX_LENGTH } = require("../utils/limits");

/** A report filed against a message. Goes from open -> dismissed or resolved. */
const reportSchema = new mongoose.Schema(
  {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message", required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, trim: true, maxlength: REPORT_REASON_MAX_LENGTH, default: "" },
    status: { type: String, enum: ["open", "dismissed", "resolved"], default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);