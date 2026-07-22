const Invitation = require("../models/Invitation");
const Membership = require("../models/Membership");
const Group = require("../models/Group");
const asyncHandler = require("../utils/asyncHandler");
const { sendInviteEmail } = require("../config/email");         

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inviteMember = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "A valid email address is required." });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingMember = await Membership.findOne({ groupId: req.groupId })
    .populate({ path: "userId", match: { email: normalizedEmail } });
  if (existingMember && existingMember.userId) {
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

const listPendingInvites = asyncHandler(async (req, res) => {
  const invites = await Invitation.find({ groupId: req.groupId, status: "pending" }).sort({ createdAt: -1 });
  res.json({ invites });
});

module.exports = { inviteMember };