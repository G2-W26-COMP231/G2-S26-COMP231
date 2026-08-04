const AdminLog = require("../models/AdminLog");

async function logAdminAction({ adminId, action, targetType, targetId, details }) {
  try {
    await AdminLog.create({ adminId, action, targetType, targetId, details: details || "" });
  } catch (err) {
    console.error("Failed to write admin log:", err);
  }
}

module.exports = { logAdminAction };
