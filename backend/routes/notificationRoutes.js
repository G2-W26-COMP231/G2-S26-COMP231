const express = require("express");
const { getRecentMessages } = require("../controllers/notificationController");

const router = express.Router();

/** Just the one route for the recent-messages notification bell. */
router.get("/messages", getRecentMessages);

module.exports = router;