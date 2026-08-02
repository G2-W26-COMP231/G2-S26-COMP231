const Event = require("../models/Events");
const Rsvp = require("../models/Rsvp");
const Membership = require("../models/Membership"); 
const asyncHandler = require("../utils/asyncHandler"); 

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

const getUpcomingEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({
    groupId: req.groupId,
    isCancelled: false,
    startTime: { $gte: new Date() },
  }).sort({ startTime: 1 });
  res.json({ events }); 
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

const cancelEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { mode } = req.query; 
  const event = await Event.findOne({ _id: eventId, groupId: req.groupId });
  
const editEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const event = await Event.findOne({ _id: eventId, groupId: req.groupId });

  if (!event) {
    return res.status(404).json({ error: "Event not found." });
  }

  if (mode === "delete") {
    await Rsvp.deleteMany({ eventId: event._id });
    await Event.deleteOne({ _id: event._id });
  } else {
    event.isCancelled = true;
    await event.save();
  }

  const io = req.app.get("io");
  if (io) {
    io.to(`group:${req.groupId}`).emit("event:cancelled", { eventId, deleted: mode === "delete" });
  }

  res.json({ ok: true, deleted: mode === "delete" });
});
  
  if (event.isCancelled) {
    return res.status(400).json({ error: "Cancelled events cannot be edited." });
  }

  const { title, location, startTime, endTime, description } = req.body;

  if (title !== undefined) {
    if (!title.trim()) return res.status(400).json({ error: "title cannot be empty." });
    if (title.trim().length > 150) return res.status(400).json({ error: "title must be 150 characters or fewer." });
    event.title = title.trim();
  }

  if (location !== undefined) {
    if (!location.trim()) return res.status(400).json({ error: "location cannot be empty." });
    if (location.trim().length > 200) return res.status(400).json({ error: "location must be 200 characters or fewer." });
    event.location = location.trim();
  }

  let start = event.startTime;
  if (startTime !== undefined) {
    start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ error: "startTime must be a valid date/time." });
    }
    if (start.getTime() < Date.now()) {
      return res.status(400).json({ error: "Event date cannot be in the past." });
    }
    event.startTime = start;
  }

  if (endTime !== undefined) {
    if (endTime === null || endTime === "") {
      event.endTime = undefined;
    } else {
      const end = new Date(endTime);
      if (Number.isNaN(end.getTime()) || end.getTime() < start.getTime()) {
        return res.status(400).json({ error: "endTime must be a valid date/time on or after startTime." });
      }
      event.endTime = end;
    }
  }

  if (description !== undefined) {
    if (description.length > 1000) {
      return res.status(400).json({ error: "description must be 1000 characters or fewer." });
    }
    event.description = description;
  }

  await event.save();

  const io = req.app.get("io");
  if (io) {
    io.to(`group:${req.groupId}`).emit("event:updated", event);
  }

  res.json({ event });
});

module.exports = { createEvent, getUpcomingEvents, getEventRsvps, editEvent };
