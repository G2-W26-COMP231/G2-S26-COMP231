const express = require("express");
const { getRecentMessages } = require("../controllers/notificationController");

const router = express.Router();

router.get("/messages", getRecentMessages);

module.exports = router;
