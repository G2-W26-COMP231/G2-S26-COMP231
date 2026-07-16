const express = require("express");
const requireMembership = require("../middleware/requireMembership");
const requireOrganizer = require("../middleware/requireOrganizer");
const { inviteMember } = require("../controllers/invitationController");

const router = express.Router({ mergeParams: true });

router.use(requireMembership, requireOrganizer);
router.post("/", inviteMember);

module.exports = router;