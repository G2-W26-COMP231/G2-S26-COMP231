const express = require("express");
const requireMembership = require("../middleware/requireMembership");
const { submitRsvp, getMyRsvp } = require("../controllers/rsvpController");

const router = express.Router({ mergeParams: true });

router.use(requireMembership);
router.post("/", submitRsvp);
router.get("/mine", getMyRsvp);    

module.exports = router;
