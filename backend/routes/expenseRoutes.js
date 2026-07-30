const express = require("express");
const requireMembership = require("../middleware/requireMembership");
const requireOrganizer = require("../middleware/requireOrganizer");
const { logExpense, listExpenses, getBalances } = require("../controllers/expenseController");

const router = express.Router({ mergeParams: true });

router.use(requireMembership, requireOrganizer);

router.post("/", logExpense);
router.get("/", listExpenses);
router.get("/balances", getBalances);

module.exports = router;