const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");
const {
  listUsers,
  getUserProfile,
  setUserStatus,
  removeUserFromGroup,
  listGroups,
  getGroupDetails,
  getGroupMembers,
  deleteGroup,
  getModerationOverview,
  getAdminLogs,
} = require("../controllers/adminController");

const { listReports, dismissReport, removeReportedMessage } = require("../controllers/reportController");
const router = express.Router();

/**
 * All the admin-only routes - users, groups, moderation overview, action
 * log, and reports. Everything here is locked behind requireAdmin.
 */
router.use(requireAdmin);
router.get("/overview", getModerationOverview);
router.get("/logs", getAdminLogs);
router.get("/users", listUsers);
router.get("/users/:userId", getUserProfile);
router.patch("/users/:userId/status", setUserStatus);
router.get("/groups", listGroups);
router.get("/groups/:groupId", getGroupDetails);
router.get("/groups/:groupId/members", getGroupMembers);
router.delete("/groups/:groupId", deleteGroup);
router.delete("/groups/:groupId/members/:userId", removeUserFromGroup);
router.get("/reports", listReports);
router.post("/reports/:reportId/dismiss", dismissReport);
router.post("/reports/:reportId/remove-message", removeReportedMessage);
module.exports = router;