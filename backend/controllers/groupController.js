const Group = require("../models/Group");
const Membership = require("../models/Membership");
const asyncHandler = require("../utils/asyncHandler");

const createGroup = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Group name is required." });
  }

  const group = await Group.create({
    name: name.trim(),
    description: description || "",
    organizerId: req.userId,
  });

  await Membership.create({
    groupId: group._id,
    userId: req.userId,
    roleInGroup: "organizer",
  });

  res.status(201).json({ group });
});

module.exports = { createGroup };

const getGroupWorkspace = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.groupId);                     
  if (!group) {                                                        
    return res.status(404).json({ error: "Group not found." });         
  }
  const isOrganizer = req.membership.roleInGroup === "organizer";       
  const [memberCount, upcomingEventCount, recentMessages, expenseCount] = await Promise.all([
    Membership.countDocuments({ groupId: group._id }),                 
    Event.countDocuments({ groupId: group._id, startTime: { $gte: new Date() }, isCancelled: false }), 
    Message.find({ groupId: group._id, isRemoved: false }).sort({ sentAt: -1 }).limit(5).populate("senderId", "name"),
  ]); 
 
  res.json({                                                            
    group,
    myRole: req.membership.roleInGroup,
    summary: { memberCount, upcomingEventCount, expenseCount },
    recentMessages: recentMessages.reverse(),
  });
});
