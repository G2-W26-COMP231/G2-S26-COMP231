const Rsvp = require("../models/Rsvp");
const asyncHandler = require("../utils/asynchHandler");

const getMyRsvp = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const rsvp = await Rsvp.findOne({ eventId, userId: req.userId });
  res.json({ rsvp: rsvp || { response: "no_response" } });
});

module.exports = { getMyRsvp };
