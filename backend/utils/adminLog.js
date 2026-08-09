const AdminLog = require("../models/AdminLog");

/**
 * Writes an entry to the admin action log. Wrapped in a try/catch on
 * purpose - if the log write fails for some reason we don't want that to
 * break the actual admin action (like a ban) that's already happened.
 *
 * @param {Object} params
 * @param {string} params.adminId
 * @param {string} params.action
 * @param {string} params.targetType - "user", "group", "message", or "report"
 * @param {string} params.targetId
 * @param {string} [params.details]
 */
async function logAdminAction({ adminId, action, targetType, targetId, details }) {
  try {
    await AdminLog.create({ adminId, action, targetType, targetId, details: details || "" });
  } catch (err) {
    console.error("Failed to write admin log:", err);
  }
}

module.exports = { logAdminAction };