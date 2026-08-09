/**
 * Blocks a route unless the current user is the organizer of the group.
 * Has to run after requireMembership since it needs req.membership to
 * already be set.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
function requireOrganizer(req, res, next) {
  if (!req.membership || req.membership.roleInGroup !== "organizer") {
    return res.status(403).json({ error: "Only the group organizer can do this." });
  }
  next();
}

module.exports = requireOrganizer;