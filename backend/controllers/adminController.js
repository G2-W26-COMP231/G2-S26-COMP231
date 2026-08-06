const mongoose = require("mongoose");
const User = require("../models/User");
const Group = require("../models/Group");
const Membership = require("../models/Membership");
const Event = require("../models/Events");
const Message = require("../models/Message");
const Expense = require("../models/Expense");
const Report = require("../models/Report");
const AdminLog = require("../models/AdminLog");
const asyncHandler = require("../utils/asyncHandler");
const { logAdminAction } = require("../utils/adminLog");

const listUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = {};
  if (search && search.trim()) {
    const re = new RegExp(search.trim(), "i");
    filter.$or = [{ name: re }, { email: re }];
  }
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ users });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  const memberships = await Membership.find({ userId }).populate("groupId", "name status");
  const groups = memberships
    .filter((m) => m.groupId)
    .map((m) => ({ id: m.groupId._id, name: m.groupId.name, status: m.groupId.status, roleInGroup: m.roleInGroup }));

  res.json({ user, groups });
});

const setUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;
  if (!["active", "banned"].includes(status)) {
    return res.status(400).json({ error: "status must be 'active' or 'banned'." });
  }
  if (userId === req.userId) {
    return res.status(400).json({ error: "You cannot change your own account status." });
  }
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  user.status = status;
  await user.save();

  await logAdminAction({
    adminId: req.userId,
    action: status === "banned" ? "ban_user" : "reactivate_user",
    targetType: "user",
    targetId: user._id,
    details: `${user.email}`,
  });

  res.json({ user });
});

const removeUserFromGroup = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({ error: "Group not found." });
  }
  const membership = await Membership.findOneAndDelete({ groupId, userId });
  if (!membership) {
    return res.status(404).json({ error: "This user is not a member of that group." });
  }
  await logAdminAction({
    adminId: req.userId,
    action: "remove_user_from_group",
    targetType: "group",
    targetId: group._id,
    details: `Removed user ${userId} from group ${group.name}`,
  });
  res.json({ removed: true });
});

const deleteGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({ error: "Group not found." });
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Membership.deleteMany({ groupId }, { session });
      const events = await Event.find({ groupId }).select("_id").session(session);
      const eventIds = events.map((e) => e._id);
      const Rsvp = require("../models/Rsvp");
      if (eventIds.length) {
        await Rsvp.deleteMany({ eventId: { $in: eventIds } }, { session });
      }
      await Event.deleteMany({ groupId }, { session });
      await Message.deleteMany({ groupId }, { session });
      await Report.deleteMany({ groupId }, { session });
      const Invitation = require("../models/Invitation");
      await Invitation.deleteMany({ groupId }, { session });
      const ExpenseShare = require("../models/ExpenseShare");
      const expenses = await Expense.find({ groupId }).select("_id").session(session);
      const expenseIds = expenses.map((e) => e._id);
      if (expenseIds.length) {
        await ExpenseShare.deleteMany({ expenseId: { $in: expenseIds } }, { session });
      }
      await Expense.deleteMany({ groupId }, { session });
      await Group.deleteOne({ _id: groupId }, { session });
    });
  } finally {
    session.endSession();
  }

  await logAdminAction({
    adminId: req.userId,
    action: "delete_group",
    targetType: "group",
    targetId: group._id,
    details: group.name,
  });

  res.json({ deleted: true });
});

const listGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find().populate("organizerId", "name email").sort({ createdAt: -1 });
  const withCounts = await Promise.all(
    groups.map(async (g) => ({
      ...g.toObject(),
      memberCount: await Membership.countDocuments({ groupId: g._id }),
    }))
  );
  res.json({ groups: withCounts });
});

const getGroupDetails = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const group = await Group.findById(groupId).populate("organizerId", "name email");
  if (!group) {
    return res.status(404).json({ error: "Group not found." });
  }
  const [memberCount, eventCount, messageCount, expenseCount, reportCount] = await Promise.all([
    Membership.countDocuments({ groupId }),
    Event.countDocuments({ groupId }),
    Message.countDocuments({ groupId }),
    Expense.countDocuments({ groupId }),
    Report.countDocuments({ groupId }),
  ]);
  res.json({ group, summary: { memberCount, eventCount, messageCount, expenseCount, reportCount } });
});

const getModerationOverview = asyncHandler(async (req, res) => {
  const [openReports, totalReports, bannedUsers, totalUsers, totalGroups] = await Promise.all([
    Report.countDocuments({ status: "open" }),
    Report.countDocuments(),
    User.countDocuments({ status: "banned" }),
    User.countDocuments(),
    Group.countDocuments(),
  ]);
  const recentReports = await Report.find({ status: "open" })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("reportedBy", "name")
    .populate("groupId", "name");
  res.json({
    summary: { openReports, totalReports, bannedUsers, totalUsers, totalGroups },
    recentReports,
  });
});

const getAdminLogs = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  const logs = await AdminLog.find()
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 200))
    .populate("adminId", "name email");
  res.json({ logs });
});

module.exports = {
  listUsers,
  getUserProfile,
  setUserStatus,
  removeUserFromGroup,
  getModerationOverview,
  getAdminLogs,
  deleteGroup,
  listGroups,
  getGroupDetails
};