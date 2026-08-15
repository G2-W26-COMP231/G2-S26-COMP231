const Invitation = require("../models/Invitation");
const Membership = require("../models/Membership");
const Group = require("../models/Group");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendInviteEmail } = require("../config/email");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Organizer invites someone to the group by email. Checks the email is
 * actually valid, that it belongs to an existing CrewUp account, makes
 * sure the person isn't already a member, and won't make a duplicate
 * invite if there's already a pending one for that email. Sends the
 * actual invite email through sendGrid (or just logs it if that's not
 * set up).
 *
 * @param {Object} req - req.body.email
 * @param {Object} res
 */
const inviteMember = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "A valid email address is required." });
  }
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (!existingUser) {
    return res.status(400).json({ error: "No CrewUp account found with this email address." });
  }

  const alreadyMember = await Membership.findOne({ groupId: req.groupId, userId: existingUser._id });
  if (alreadyMember) {
    return res.status(409).json({ error: "This person is already a member of the group." });
  }

  const existingInvite = await Invitation.findOne({
    groupId: req.groupId,
    email: normalizedEmail,
    status: "pending",
  });
  if (existingInvite) {
    return res.status(200).json({ invitation: existingInvite, note: "Invitation already pending." });
  }

  const invitation = await Invitation.create({
    groupId: req.groupId,
    email: normalizedEmail,
    invitedBy: req.userId,
  });

  const group = await Group.findById(req.groupId).select("name");
  const emailResult = await sendInviteEmail({
    to: normalizedEmail,
    groupName: group?.name || "a CrewUp group",
    inviterName: req.user.name,
    token: invitation.token,
  });
  res.status(201).json({ invitation, emailSent: emailResult.sent });
});

/**
 * Organizer-only: lists the pending (not yet accepted/declined) invites
 * for a group.
 *
 * @param {Object} req
 * @param {Object} res
 */
const listPendingInvites = asyncHandler(async (req, res) => {
  const invites = await Invitation.find({ groupId: req.groupId, status: "pending" }).sort({ createdAt: -1 });
  res.json({ invites });
});

/**
 * Gets all the pending invites sent TO the current logged-in user (matched
 * by their email), for the notification bell dropdown.
 *
 * @param {Object} req
 * @param {Object} res
 */
const listMyInvitations = asyncHandler(async (req, res) => {
  const invites = await Invitation.find({ email: req.user.email.toLowerCase(), status: "pending" })
    .populate("groupId", "name")
    .populate("invitedBy", "name")
    .sort({ createdAt: -1 });
  res.json({ invites });
});

/**
 * Accepts an invitation by its token. Checks the token is real, hasn't
 * already been used, hasn't expired, and actually matches the logged-in
 * user's email (so you can't accept someone else's invite even if you
 * somehow got the link). If all good, adds them as a member.
 *
 * @param {Object} req - req.params.token
 * @param {Object} res
 */
const acceptInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const invitation = await Invitation.findOne({ token });
  if (!invitation) {
    return res.status(404).json({ error: "This invitation link is invalid." });
  }
  if (invitation.status === "accepted") {
    return res.status(409).json({ error: "This invitation has already been accepted." });
  }
  if (invitation.status !== "pending") {
    return res.status(409).json({ error: `This invitation was ${invitation.status}.` });
  }
  if (invitation.isExpired()) {
    invitation.status = "expired";
    await invitation.save();
    return res.status(410).json({ error: "This invitation has expired." });
  }
  if (invitation.email !== req.user.email.toLowerCase()) {
    return res.status(403).json({ error: "This invitation was sent to a different email address." });
  }
  const alreadyMember = await Membership.findOne({ groupId: invitation.groupId, userId: req.userId });
  if (!alreadyMember) {
    await Membership.create({ groupId: invitation.groupId, userId: req.userId, roleInGroup: "member" });
  }
  invitation.status = "accepted";
  await invitation.save();
  res.json({ groupId: invitation.groupId, invitation });
});

/**
 * Declines an invitation - same checks as accept (has to actually belong
 * to the current user's email) but just marks it declined instead of
 * making them a member.
 *
 * @param {Object} req - req.params.token
 * @param {Object} res
 */
const declineInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const invitation = await Invitation.findOne({ token });
  if (!invitation) {
    return res.status(404).json({ error: "This invitation link is invalid." });
  }
  if (invitation.status !== "pending") {
    return res.status(409).json({ error: `This invitation was already ${invitation.status}.` });
  }
  if (invitation.email !== req.user.email.toLowerCase()) {
    return res.status(403).json({ error: "This invitation was sent to a different email address." });
  }
  invitation.status = "declined";
  await invitation.save();
  res.json({ invitation });
});

/**
 * Gets invites the current user sent out that got accepted or declined,
 * but that they haven't seen a notification for yet. Used so the inviter
 * finds out when someone responds to their invite.
 *
 * @param {Object} req
 * @param {Object} res
 */
const listInviteResponses = asyncHandler(async (req, res) => {
  const responses = await Invitation.find({
    invitedBy: req.userId,
    status: { $in: ["accepted", "declined"] },
    seenByInviter: false,
  })
    .populate("groupId", "name")
    .sort({ updatedAt: -1 });
  res.json({ responses });
});

/**
 * Marks all of the current user's unseen invite responses as seen, so they
 * stop showing up as new notifications. Called when they open the
 * notification dropdown.
 *
 * @param {Object} req
 * @param {Object} res
 */
const markInviteResponsesSeen = asyncHandler(async (req, res) => {
  await Invitation.updateMany(
    { invitedBy: req.userId, status: { $in: ["accepted", "declined"] }, seenByInviter: false },
    { $set: { seenByInviter: true } }
  );
  res.json({ ok: true });
});

module.exports = {
  inviteMember,
  listPendingInvites,
  listMyInvitations,
  acceptInvitation,
  declineInvitation,
  listInviteResponses,
  markInviteResponsesSeen,
};