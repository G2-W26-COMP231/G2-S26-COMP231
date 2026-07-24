const Membership = require("../models/Membership");

async function requireMembership(req, res, next) {
  const groupId = req.params.groupId || req.body.group || req.body.groupId;
  if (!groupId) {
    return res.status(400).json({ error: "groupId is required." });
  }

  const membership = await Membership.findOne({ groupId, userId: req.userId });
  if (!membership) {
    return res.status(403).json({ error: "You are not a member of this group." });
  }

  req.membership = membership;
  req.groupId = groupId;
  next();
}

module.exports = requireMembership;