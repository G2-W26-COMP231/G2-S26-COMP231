const express = require("express");
const requireMembership = require("../middleware/requireMembership");
const requireOrganizer = require("../middleware/requireOrganizer");
const { createEvent, getUpcomingEvents, getEventRsvps, editEvent } = require("../controllers/eventController");
const { submitRsvp, getMyRsvp } = require("../controllers/rsvpController");

const router = express.Router({ mergeParams: true });

router.use(requireMembership);

router.post("/", requireOrganizer, createEvent);
router.get("/", getUpcomingEvents);
router.get("/:eventId/rsvps", requireOrganizer, getEventRsvps);
router.get("/:eventId/rsvp", getMyRsvp);
router.post("/:eventId/rsvp", submitRsvp);
router.patch("/:eventId", requireOrganizer, editEvent);
router.delete("/:eventId", requireOrganizer, cancelEvent);

module.exports = router;
