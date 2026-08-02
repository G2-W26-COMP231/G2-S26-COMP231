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

router.use(requireAdmin);
router.get("/overview", getModerationOverview);
router.get("/reports", listReports);
router.delete("/groups/:groupId/members/:userId", removeUserFromGroup);
router.post("/reports/:reportId/remove-message", removeReportedMessage);

module.exports = router;
