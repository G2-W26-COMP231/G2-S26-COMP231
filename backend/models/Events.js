const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    location: { type: String, required: true, trim: true, maxlength: 200 },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isCancelled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventSchema.index({ groupId: 1, startTime: 1 });

module.exports = mongoose.model("Event", eventSchema);