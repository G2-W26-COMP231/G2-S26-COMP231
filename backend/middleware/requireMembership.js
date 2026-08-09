const Membership = require("../models/Membership");

/**
 * Checks that the logged-in user is actually a member of the group they're
 * trying to access, and blocks the request if not. Grabs the groupId from
 * params/body (whichever is there), then attaches req.membership and
 * req.groupId so later handlers/middleware (like requireOrganizer) can use
 * them without looking it up again.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
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