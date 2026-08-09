const Membership = require("../models/Membership");
const Message = require("../models/Message");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Grabs the most recent message from each of the user's groups, for the
 * notification bell dropdown. Only shows the LATEST message per group so
 * one busy group chat doesn't flood out the others - pulls 100 messages
 * total across all groups first, then just keeps the first one we see for
 * each group (since they're sorted newest-first that's automatically the
 * newest one), capped at 10 groups shown.
 *
 * @param {Object} req
 * @param {Object} res
 */
const getRecentMessages = asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ userId: req.userId }).select("groupId");
  const groupIds = memberships.map((m) => m.groupId);

  if (groupIds.length === 0) {
    return res.json({ messages: [] });
  }

  const recent = await Message.find({
    groupId: { $in: groupIds },
    isRemoved: false,
    senderId: { $ne: req.userId },
  })
    .sort({ sentAt: -1 })
    .limit(100)
    .populate("senderId", "name")
    .populate("groupId", "name");

  const seenGroups = new Set();
  const messages = [];
  for (const msg of recent) {
    const gid = msg.groupId?._id?.toString();
    if (!gid || seenGroups.has(gid)) continue;
    seenGroups.add(gid);
    messages.push(msg);
    if (messages.length >= 10) break;
  }

  res.json({ messages });
});

module.exports = { getRecentMessages };