const express = require("express");
const requireMembership = require("../middleware/requireMembership");
const requireOrganizer = require("../middleware/requireOrganizer");
const { logExpense, listExpenses } = require("../controllers/expenseController");

const router = express.Router({ mergeParams: true });

router.use(requireMembership, requireOrganizer);

router.post("/", logExpense);
router.get("/", listExpenses);

module.exports = router;