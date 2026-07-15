// controllers/groupController.js
// M1 - As a Group Organizer, I can create a group.
const Group = require("../models/Group");
const Membership = require("../models/Membership");
const asyncHandler = require("../utils/asyncHandler");

// M1 - As a Group Organizer, I can create a group.
// Note: the creator automatically becomes the first member with organizer rights.
// Note: inviting members is handled in a separate story (M2).
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
