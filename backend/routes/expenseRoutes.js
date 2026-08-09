const express = require("express");
const requireMembership = require("../middleware/requireMembership");
const requireOrganizer = require("../middleware/requireOrganizer");
const { logExpense, listExpenses, getBalances } = require("../controllers/expenseController");

const router = express.Router({ mergeParams: true });

/**
 * Expense routes for a group. Any member can view expenses/balances,
 * but only the organizer can log a new one.
 */
router.use(requireMembership);
router.get("/", listExpenses);
router.get("/balances", getBalances);
router.post("/", requireOrganizer, logExpense);

module.exports = router;