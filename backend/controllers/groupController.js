const mongoose = require("mongoose");
const Group = require("../models/Group");
const Membership = require("../models/Membership");
const Event = require("../models/Events");
const Message = require("../models/Message");
const Expense = require("../models/Expense");
const asyncHandler = require("../utils/asyncHandler");


const createGroup = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Group name is required." });
  }
  if (name.trim().length > 100) {
    return res.status(400).json({ error: "Group name must be 100 characters or fewer." });
  }
  const session = await mongoose.startSession();
  let group;
  try {
    await session.withTransaction(async () => {
      const created = await Group.create(
        [{ name: name.trim(), description: description || "", organizerId: req.userId }],
        { session }
      );
      group = created[0];
      await Membership.create(
        [{ groupId: group._id, userId: req.userId, roleInGroup: "organizer" }],
        { session }
      );
    });
  } finally {
    session.endSession();
  }
  res.status(201).json({ group });
});

const getMyGroups = asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ userId: req.userId }).populate("groupId");
  const groups = memberships
    .filter((m) => m.groupId)
    .map((m) => ({ ...m.groupId.toObject(), myRole: m.roleInGroup }));
  res.json({ groups });
});

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
    isOrganizer ? Expense.countDocuments({ groupId: group._id }) : Promise.resolve(undefined),
  ]);
  res.json({
    group,
    myRole: req.membership.roleInGroup,
    summary: { memberCount, upcomingEventCount, expenseCount },
    recentMessages: recentMessages.reverse(),
  });
});

const getGroupMembers = asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ groupId: req.groupId })
    .populate("userId", "name email")
    .sort({ roleInGroup: 1 });
  const members = memberships
    .filter((m) => m.userId)
    .map((m) => ({ id: m.userId._id, name: m.userId.name, email: m.userId.email, role: m.roleInGroup }));
  res.json({ members });
});

module.exports = { createGroup, getMyGroups, getGroupWorkspace, getGroupMembers };