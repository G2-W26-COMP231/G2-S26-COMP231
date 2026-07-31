const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");
const { listReports } = require("../controllers/reportController");

const router = express.Router();

router.use(requireAdmin);

router.get("/reports", listReports);

module.exports = router;
