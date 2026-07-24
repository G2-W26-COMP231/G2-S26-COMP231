const Expense = require("../models/Expense");
const ExpenseShare = require("../models/ExpenseShare");
const asyncHandler = require("../utils/asyncHandler");
const { buildShares } = require("../utils/expenseSplit");

const logExpense = asyncHandler(async (req, res) => {
  const { title, amount, memberIds, splitType = "equal", customShares } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Expense title is required." });
  }

  const shares = buildShares(amount, memberIds, splitType, customShares);

  const expense = await Expense.create({
    groupId: req.groupId,
    paidBy: req.userId,
    title: title.trim(),
    amount,
    splitType,
  });

  const expenseShares = await ExpenseShare.insertMany(
    shares.map((share) => ({
      expenseId: expense._id,
      groupId: req.groupId,
      memberId: share.memberId,
      amountCents: share.amountCents,
    }))
  );

  res.status(201).json({ expense, shares: expenseShares });
});

module.exports = { logExpense };
