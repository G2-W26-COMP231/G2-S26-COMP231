const Membership = require("../models/Membership");

const requireMembership = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.body.groupId;
    const userId = req.userId;

    if (!groupId) {
      return res.status(400).json({ error: "Group id is required." });
    }

    const membership = await Membership.findOne({ groupId, userId });

    if (!membership) {
      return res.status(403).json({ error: "You are not a member of this group." });
    }

    req.groupId = groupId;
    req.membership = membership;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireMembership;
