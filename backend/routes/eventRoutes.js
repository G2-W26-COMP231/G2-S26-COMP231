const express = require("express");
const requireMembership = require("../middleware/requireMembership");
const requireOrganizer = require("../middleware/requireOrganizer");
const { createEvent, getUpcomingEvents, getEventRsvps, editEvent, cancelEvent } = require("../controllers/eventController");
const { submitRsvp, getMyRsvp } = require("../controllers/rsvpController");

const router = express.Router({ mergeParams: true });

/**
 * Event + RSVP routes for a group. Nested under a group id, so
 * requireMembership runs first to make sure you're actually in the group.
 * Create/edit/cancel are organizer-only, RSVPing is open to any member.
 */
router.use(requireMembership);
router.post("/", requireOrganizer, createEvent);
router.get("/", getUpcomingEvents);
router.get("/:eventId/rsvps", requireOrganizer, getEventRsvps);
router.get("/:eventId/rsvp", getMyRsvp);
router.post("/:eventId/rsvp", submitRsvp);
router.patch("/:eventId", requireOrganizer, editEvent);
router.delete("/:eventId", requireOrganizer, cancelEvent);

module.exports = router;