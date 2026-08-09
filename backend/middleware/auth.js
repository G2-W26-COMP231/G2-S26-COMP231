const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware that checks for a valid JWT on every protected route. Pulls
 * the token out of the Authorization header (needs to be "Bearer <token>"),
 * verifies it, then looks up the user and attaches them to req.user /
 * req.userId so every route after this can use them. Also blocks banned
 * users here so they get logged out effectively.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Invalid session. Please log in again." });
    }
    if (user.status === "banned") {
      return res.status(403).json({ error: "This account has been deactivated." });
    }
    req.userId = user._id.toString();
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}

module.exports = requireAuth;