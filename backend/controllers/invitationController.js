const Invitation = require("../models/Invitation");
const Membership = require("../models/Membership");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

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

  res.status(201).json({ invitation });
});

const acceptInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const invitation = await Invitation.findOne({ token });

  if (!invitation) {
    return res.status(404).json({ error: "Invitation not found." });
  }

  if (invitation.status !== "pending") {
    return res.status(400).json({ error: "Invitation is no longer pending." });
  }

  if (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()) {
    invitation.status = "expired";
    await invitation.save();
    return res.status(400).json({ error: "Invitation has expired." });
  }

  const user = await User.findById(req.userId);

  if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return res.status(403).json({ error: "This invitation does not belong to your account." });
  }

  const existingMembership = await Membership.findOne({
    groupId: invitation.groupId,
    userId: req.userId,
  });

  if (!existingMembership) {
    await Membership.create({
      groupId: invitation.groupId,
      userId: req.userId,
      roleInGroup: "member",
    });
  }

  invitation.status = "accepted";
  await invitation.save();

  res.json({ message: "Invitation accepted successfully.", invitation });
});

//List pending invitations for a group
const listPendingInvites = asyncHandler(async (req, res) => {
  const invitations = await Invitation.find({
    groupId: req.groupId,
    status: "pending",
  }).sort({ createdAt: -1 });

  res.json({ invitations });
});

module.exports = { inviteMember, listPendingInvites, acceptInvitation };
