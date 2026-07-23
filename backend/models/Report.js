const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message", required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: ["open", "dismissed", "resolved"], default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
