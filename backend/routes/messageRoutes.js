const express = require("express");
const requireMembership = require("../middleware/requireMembership");
const { sendMessage, getMessageHistory } = require("../controllers/messageController");
const { reportMessage } = require("../controllers/reportController");
const router = express.Router({ mergeParams: true });

router.use(requireMembership); 
router.post("/", sendMessage); 

module.exports = router;