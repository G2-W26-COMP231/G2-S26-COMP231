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

const removeReportedMessage = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const report = await Report.findById(reportId);
  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }
  const message = await Message.findById(report.messageId);
  if (!message) {
    return res.status(404).json({ error: "Reported message no longer exists." });
  }
  message.isRemoved = true;
  await message.save();
  report.status = "resolved";
  await report.save();
  await logAdminAction({
    adminId: req.userId,
    action: "remove_reported_message",
    targetType: "message",
    targetId: message._id,
    details: `Report ${report._id}`,
  });
  const io = req.app.get("io");
  if (io) {
    io.to(`group:${message.groupId}`).emit("message:removed", { messageId: message._id.toString() });
  }
  res.json({ message, report });
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


module.exports = { reportMessage, listReports, removeReportedMessage };