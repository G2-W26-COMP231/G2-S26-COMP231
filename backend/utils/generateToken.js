const jwt = require("jsonwebtoken");

/**
 * Makes a JWT for a logged-in user. Expires after 7 days by default
 * unless JWT_EXPIRES_IN is set differently in the .env file.
 *
 * @param {Object} user - needs at least _id and email
 * @returns {string}
 */
function generateToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

module.exports = generateToken;