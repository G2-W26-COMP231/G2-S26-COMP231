const Message = require("../models/Message");
const Report = require("../models/Report");
const asyncHandler = require("../utils/asyncHandler");

const reportMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { reason } = req.body;
  const message = await Message.findOne({ _id: messageId, groupId: req.groupId });
  if (!message) {
    return res.status(404).json({ error: "Message not found." });
  }
  const report = await Report.create({
    messageId: message._id,
    groupId: req.groupId,
    reportedBy: req.userId,
    reason: reason || "",
  });
  res.status(201).json({ report });
});

const listReports = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};

  if (status && ["open", "dismissed", "resolved"].includes(status)) {
    filter.status = status;
  }

  const reports = await Report.find(filter)
    .sort({ createdAt: -1 })
    .populate("reportedBy", "name email")
    .populate("groupId", "name")
    .populate({
      path: "messageId",
      select: "content senderId isRemoved sentAt",
      populate: { path: "senderId", select: "name email" },
    });

  res.json({ reports });
});

module.exports = { reportMessage, listReports };
