const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, trim: true },
    targetType: { type: String, enum: ["user", "group", "message", "report"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    details: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

adminLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AdminLog", adminLogSchema);
