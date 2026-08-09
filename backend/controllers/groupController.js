const mongoose = require("mongoose");
const Group = require("../models/Group");
const Membership = require("../models/Membership");
const Event = require("../models/Events");
const Message = require("../models/Message");
const Expense = require("../models/Expense");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Creates a group and automatically makes whoever created it the organizer.
 * Uses a transaction so we don't end up with a group that has no organizer
 * membership if something fails halfway through.
 *
 * @param {Object} req - needs name (required) and description (optional)
 * @param {Object} res
 */
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

/**
 * Gets every group the logged-in user is part of (organizer or member),
 * and tags each one with what role they have in it.
 *
 * @param {Object} req
 * @param {Object} res
 */
const getMyGroups = asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ userId: req.userId }).populate("groupId");
  const groups = memberships
    .filter((m) => m.groupId)
    .map((m) => ({ ...m.groupId.toObject(), myRole: m.roleInGroup }));
  res.json({ groups });
});

/**
 * Gets the main "workspace" view for a group - member count, upcoming event
 * count, last 5 messages, and (if you're the organizer) the expense count too.
 * req.membership and req.groupId already got set by the requireMembership
 * middleware before this runs.
 *
 * @param {Object} req
 * @param {Object} res
 */
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

/**
 * Returns the list of members in a group (just name/email/role), sorted so
 * the organizer shows up first.
 *
 * @param {Object} req
 * @param {Object} res
 */
const getGroupMembers = asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ groupId: req.groupId })
    .populate("userId", "name email")
    .sort({ roleInGroup: 1 });
  const members = memberships
    .filter((m) => m.userId)
    .map((m) => ({ id: m.userId._id, name: m.userId.name, email: m.userId.email, role: m.roleInGroup }));
  res.json({ members });
});

/**
 * Lets the organizer kick someone out of the group. Can't remove yourself
 * this way (there's a separate delete-group flow for that), and can't
 * remove the organizer obviously.
 *
 * @param {Object} req - req.params.memberId is who's getting removed
 * @param {Object} res
 */
const removeMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  if (memberId === req.userId) {
    return res.status(400).json({ error: "Organizers can't remove themselves. Delete the group instead." });
  }
  const membership = await Membership.findOne({ groupId: req.groupId, userId: memberId });
  if (!membership) {
    return res.status(404).json({ error: "This person is not a member of the group." });
  }
  if (membership.roleInGroup === "organizer") {
    return res.status(400).json({ error: "The organizer cannot be removed." });
  }
  await Membership.deleteOne({ _id: membership._id });
  res.json({ removed: true });
});

/**
 * Lets a regular member leave a group on their own. Organizers can't use
 * this - they have to delete the group instead since someone has to own it.
 *
 * @param {Object} req
 * @param {Object} res
 */
const leaveGroup = asyncHandler(async (req, res) => {
  if (req.membership.roleInGroup === "organizer") {
    return res.status(400).json({ error: "Organizers cannot leave their own group. Delete it instead." });
  }
  await Membership.deleteOne({ _id: req.membership._id });
  res.json({ left: true });
});

module.exports = { createGroup, getMyGroups, getGroupWorkspace, getGroupMembers, removeMember, leaveGroup };