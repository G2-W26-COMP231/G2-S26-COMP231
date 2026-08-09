const Event = require("../models/Events");
const Rsvp = require("../models/Rsvp");
const asyncHandler = require("../utils/asyncHandler");
const VALID_RESPONSES = ["going", "maybe", "cant_make_it"];

/**
 * Submits or updates a member's RSVP for an event. Uses upsert so it works
 * whether or not they've already RSVP'd before - just overwrites it. Also
 * fires a socket event so the organizer's RSVP list updates live without
 * needing a refresh.
 *
 * @param {Object} req - req.params.eventId, req.body.response
 * @param {Object} res
 */
const submitRsvp = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { response } = req.body;
  if (!VALID_RESPONSES.includes(response)) {
    return res.status(400).json({ error: `response must be one of: ${VALID_RESPONSES.join(", ")}` });
  }
  const event = await Event.findOne({ _id: eventId, groupId: req.groupId });
  if (!event) {
    return res.status(404).json({ error: "Event not found." });
  }
  const rsvp = await Rsvp.findOneAndUpdate(
    { eventId, userId: req.userId },
    { response, respondedAt: new Date() },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const io = req.app.get("io");
  if (io) {
    io.to(`group:${req.groupId}`).emit("rsvp:update", {
      eventId,
      userId: req.userId,
      response: rsvp.response,
    });
  }
  res.json({ rsvp });
});

/**
 * Checks what the current user's RSVP status is for one event. Returns
 * "no_response" as a default if they haven't RSVP'd yet instead of just
 * returning nothing, so the frontend doesn't have to handle a null case.
 *
 * @param {Object} req - req.params.eventId
 * @param {Object} res
 */
const getMyRsvp = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const rsvp = await Rsvp.findOne({ eventId, userId: req.userId });
  res.json({ rsvp: rsvp || { response: "no_response" } });
});

module.exports = { submitRsvp, getMyRsvp };