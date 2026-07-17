const mongoose = require("mongoose");

const rsvpSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    response: {
      type: String,
      enum: ["no_response", "going", "maybe", "cant_make_it"],
      default: "no_response",
    },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

rsvpSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Rsvp", rsvpSchema);