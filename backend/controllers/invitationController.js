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

const listMyInvitations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  const invitations = await Invitation.find({
    email: user.email.toLowerCase(),
    status: "pending",
  })
    .populate("groupId", "name description")
    .sort({ createdAt: -1 });

  res.json({ invitations });
});

module.exports = { inviteMember, listMyInvitations };
