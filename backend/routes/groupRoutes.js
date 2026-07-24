const express = require("express");
const requireMembership = require("../middleware/requireMembership");
const { createGroup, getMyGroups, getGroupWorkspace, getGroupMembers } = require("../controllers/groupController");

const router = express.Router();

router.post("/", createGroup);
router.get("/mine", getMyGroups);
router.get("/:groupId", requireMembership, getGroupWorkspace);
router.get("/:groupId/members", requireMembership, getGroupMembers);

module.exports = router;