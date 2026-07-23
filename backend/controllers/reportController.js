const Message = require("../models/Message");
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

module.exports = { reportMessage };