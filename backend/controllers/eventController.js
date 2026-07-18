const Event = require("../models/Events");
const Rsvp = require("../models/Rsvp");
const Membership = require("../models/Membership");
const asyncHandler = require("../utils/asynchHandler");

const createEvent = asyncHandler(async (req, res) => {
  const { title, location, startTime, endTime, description } = req.body;

  if (!title || !location || !startTime) {
    return res.status(400).json({ error: "title, location, and startTime are required." });
  }
  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) {
    return res.status(400).json({ error: "startTime must be a valid date/time." });
  }
  if (start.getTime() < Date.now()) {
    return res.status(400).json({ error: "Event date cannot be in the past." });
  }
  let end;
  if (endTime) {
    end = new Date(endTime);
    if (Number.isNaN(end.getTime()) || end.getTime() < start.getTime()) {
      return res.status(400).json({ error: "endTime must be a valid date/time on or after startTime." });
    }
  }

  const event = await Event.create({
    groupId: req.groupId,
    title: title.trim(),
    location: location.trim(),
    startTime: start,
    endTime: end,
    description: description || "",
    createdBy: req.userId,
  });

  const members = await Membership.find({ groupId: req.groupId }).select("userId");
  if (members.length > 0) {
    await Rsvp.insertMany(
      members.map((m) => ({ eventId: event._id, userId: m.userId, response: "no_response" })),
      { ordered: false }
    );
  }

  res.status(201).json({ event });
});

const getEventRsvps = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const event = await Event.findOne({ _id: eventId, groupId: req.groupId });
  if (!event) {
    return res.status(404).json({ error: "Event not found." });
  }
  const rsvps = await Rsvp.find({ eventId }).populate("userId", "name email");
  res.json({ event, rsvps });
});

module.exports = { createEvent, getEventRsvps };
