const express = require("express");
const requireMembership = require("../middleware/requireMembership");
const { submitRsvp } = require("../controllers/rsvpController");

const router = express.Router({ mergeParams: true });

/** Standalone RSVP submit route, nested under a group/event. */
router.use(requireMembership);
router.post("/", submitRsvp);

module.exports = router;