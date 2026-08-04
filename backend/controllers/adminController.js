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
  setUserStatus,
  removeUserFromGroup,
  getModerationOverview,
  getAdminLogs,
};