const Event = require("../models/Event");
const Rsvp = require("../models/Rsvp");
const asyncHandler = require("../utils/asyncHandler");

const VALID_RESPONSES = ["going", "maybe", "cant_make_it"];

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

  res.json({ rsvp });
});

const getMyRsvp = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const rsvp = await Rsvp.findOne({ eventId, userId: req.userId });
  res.json({ rsvp: rsvp || { response: "no_response" } });
});

module.exports = { submitRsvp, getMyRsvp };
