const Message = require("../models/Message");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Shared helper that actually saves a message and sends it out over
 * socket.io to everyone in the group. Both the socket "send message" event
 * and the plain REST endpoint below call this so we don't duplicate the
 * validation/save logic in two places.
 *
 * @param {Object} params
 * @param {string} params.groupId
 * @param {string} params.senderId
 * @param {string} params.body - the raw message text
 * @param {Object} params.io - the socket.io server instance, or null if not available
 * @returns {Promise<Object>} the saved message, populated with sender info
 */
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

/**
 * REST fallback for sending a message, in case the socket connection isn't
 * working for some reason. Just calls persistAndBroadcast under the hood.
 *
 * @param {Object} req - needs body.body (the message text)
 * @param {Object} res
 */
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

/**
 * Gets a page of message history for a group. Supports "before" (load older
 * messages, for scrolling up) and "after" (catch up on new messages after
 * reconnecting). If neither is given it just returns the most recent page.
 *
 * @param {Object} req - query params: before, after, limit
 * @param {Object} res
 */
const getMessageHistory = asyncHandler(async (req, res) => {
  const { before, after, limit = 30 } = req.query;
  const pageSize = Math.min(Number(limit) || 30, 100);
  const filter = { groupId: req.groupId, isRemoved: false };
  if (before) {
    const beforeDate = new Date(before);
    if (!Number.isNaN(beforeDate.getTime())) {
      filter.sentAt = { $lt: beforeDate };
    }
  }
  if (after) {
    const afterDate = new Date(after);
    if (!Number.isNaN(afterDate.getTime())) {
      filter.sentAt = { $gt: afterDate };
    }
  }
  const sortDirection = after ? 1 : -1;
  const messages = await Message.find(filter)
    .sort({ sentAt: sortDirection })
    .limit(pageSize)
    .populate("senderId", "name email");
  res.json({
    messages: after ? messages : messages.reverse(),
    hasMore: messages.length === pageSize,
  });
});

module.exports = { sendMessage, getMessageHistory, persistAndBroadcast };