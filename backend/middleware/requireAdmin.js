/**
 * Blocks a route unless the logged-in user's role is "admin". Needs to run
 * after requireAuth so req.user actually exists.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Administrator access required." });
  }
  next();
}
module.exports = requireAdmin;