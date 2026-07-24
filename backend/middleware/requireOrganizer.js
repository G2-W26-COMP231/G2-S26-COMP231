function requireOrganizer(req, res, next) {
  if (!req.membership || req.membership.roleInGroup !== "organizer") {
    return res.status(403).json({ error: "Only the group organizer can do this." });
  }
  next();
}

module.exports = requireOrganizer;