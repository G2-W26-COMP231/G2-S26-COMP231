const mongoose = require("mongoose");
const { EVENT_TITLE_MAX_LENGTH, EVENT_LOCATION_MAX_LENGTH, EVENT_DESCRIPTION_MAX_LENGTH } = require("../utils/limits");

/** A group event. isCancelled is a soft delete, we don't actually remove it. */
const eventSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    title: { type: String, required: true, trim: true, maxlength: EVENT_TITLE_MAX_LENGTH },
    location: { type: String, required: true, trim: true, maxlength: EVENT_LOCATION_MAX_LENGTH },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    description: { type: String, trim: true, maxlength: EVENT_DESCRIPTION_MAX_LENGTH, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isCancelled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventSchema.index({ groupId: 1, startTime: 1 });

module.exports = mongoose.model("Event", eventSchema);