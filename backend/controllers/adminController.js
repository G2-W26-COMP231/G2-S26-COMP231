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

/**
 * Admin-only: lists every user in the system. Supports a search query that
 * checks both name and email (case-insensitive) if one's provided.
 *
 * @param {Object} req - optional query.search
 * @param {Object} res
 */
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

/**
 * Admin-only: gets one user's full profile plus every group they're a
 * member of and what role they have in each.
 *
 * @param {Object} req - req.params.userId
 * @param {Object} res
 */
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

/**
 * Admin-only: bans or reactivates a user account. Can't be used on your
 * own account (an admin can't accidentally lock themselves out). Every
 * ban/reactivate gets written to the admin action log for S6.
 *
 * @param {Object} req - req.params.userId, req.body.status ("active" or "banned")
 * @param {Object} res
 */
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

/**
 * Admin-only: kicks a user out of a specific group (different from
 * removeMember in groupController.js, since that one's for organizers -
 * this is the admin version that works on any group).
 *
 * @param {Object} req - req.params.groupId, req.params.userId
 * @param {Object} res
 */
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

/**
 * Admin-only: lists every group in the whole system, with a member count
 * attached to each one.
 *
 * @param {Object} req
 * @param {Object} res
 */
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

/**
 * Admin-only: gets one group's details plus a summary of everything in it -
 * how many members, events, messages, expenses, and reports it has. Used
 * for the admin group detail page.
 *
 * @param {Object} req - req.params.groupId
 * @param {Object} res
 */
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

/**
 * Admin-only: gets the member list for any group (works even if the admin
 * isn't a member of that group themselves, unlike the regular
 * getGroupMembers in groupController.js).
 *
 * @param {Object} req - req.params.groupId
 * @param {Object} res
 */
const getGroupMembers = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const memberships = await Membership.find({ groupId })
    .populate("userId", "name email status")
    .sort({ roleInGroup: 1 });

  const members = memberships
    .filter((m) => m.userId)
    .map((m) => ({
      id: m.userId._id,
      name: m.userId.name,
      email: m.userId.email,
      status: m.userId.status,
      role: m.roleInGroup,
      joinedAt: m.joinedAt,
    }));

  res.json({ members });
});

/**
 * Admin-only: completely deletes a group and everything tied to it -
 * memberships, events, RSVPs, messages, reports, invitations, expenses,
 * expense shares, all of it. Runs in a transaction so it either all
 * succeeds or none of it does (don't want a half-deleted group floating
 * around with orphaned data).
 *
 * @param {Object} req - req.params.groupId
 * @param {Object} res
 */
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

/**
 * Admin-only: quick dashboard summary for the moderation overview page -
 * how many open reports, total reports, banned users, total users, total
 * groups, plus the 5 most recent open reports so admins can jump right in.
 *
 * @param {Object} req
 * @param {Object} res
 */
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

/**
 * Admin-only: gets the activity log of everything admins have done (bans,
 * removals, deletions, etc), newest first. Capped at 200 even if someone
 * asks for a higher limit, just to be safe.
 *
 * @param {Object} req - optional query.limit
 * @param {Object} res
 */
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
  listGroups,
  getGroupDetails,
  getGroupMembers,
  deleteGroup,
  getModerationOverview,
  getAdminLogs,
};