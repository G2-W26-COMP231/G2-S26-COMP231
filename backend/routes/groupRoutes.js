const express = require("express");
const requireMembership = require("../middleware/requireMembership");
const requireOrganizer = require("../middleware/requireOrganizer");
const { 
    createGroup, 
    getMyGroups, 
    getGroupWorkspace,
    getGroupMembers,
    removeMember,
    leaveGroup 
} = require("../controllers/groupController");

const router = express.Router();

router.post("/", createGroup);
router.get("/mine", getMyGroups);
router.get("/:groupId", requireMembership, getGroupWorkspace);
router.get("/:groupId/members", requireMembership, getGroupMembers);
router.delete("/:groupId/members/:memberId", requireMembership, requireOrganizer, removeMember);
router.post("/:groupId/leave", requireMembership, leaveGroup);

module.exports = router;