const Message = require("../models/Message"); 
const asyncHandler = require("../utils/asyncHandler"); 

async function persistAndBroadcast({ groupId, senderId, body, io }) {
  const trimmed = (body || "").trim();
  if (!trimmed) {
    const err = new Error("Message cannot be empty.");
    err.status = 400;
    throw err;
  }
  if (trimmed.length > 2000) {
    const err = new Error("Message is too long (2000 character limit).");
    err.status = 400;
    throw err;
  }
  const message = await Message.create({ groupId, senderId, content: trimmed });
  const populated = await message.populate("senderId", "name email");
  if (io) {
    io.to(`group:${groupId}`).emit("message:new", populated);
  }
  return populated;
}

const sendMessage = asyncHandler(async (req, res) => {
  try {
    const message = await persistAndBroadcast({
      groupId: req.groupId,
      senderId: req.userId,
      body: req.body.body,
      io: req.app.get("io"),
    });
    res.status(201).json({ message });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

module.exports = { sendMessage, getMessageHistory, persistAndBroadcast };