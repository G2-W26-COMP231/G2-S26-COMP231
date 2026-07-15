// routes/groupRoutes.js
// M1 - As a Group Organizer, I can create a group.
const express = require("express");
const { createGroup } = require("../controllers/groupController");

const router = express.Router();

router.post("/", createGroup); // M1

module.exports = router;
