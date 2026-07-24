const mongoose = require("mongoose");
const Membership = require("../models/Membership");
const Expense = require("../models/Expense");
const ExpenseShare = require("../models/ExpenseShare");
const asyncHandler = require("../utils/asyncHandler");
const { buildShares } = require("../utils/expenseSplit");

const logExpense = asyncHandler(async (req, res) => {
  const { description, amount, payerId, memberIds, splitType, customShares } = req.body;

  if (!description || !description.trim()) {
    return res.status(400).json({ error: "Description is required." });
  }
  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number." });
  }
  if (!payerId) {
    return res.status(400).json({ error: "payerId is required." });
  }
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ error: "Select at least one member to split with." });
  }

  const memberships = await Membership.find({
    groupId: req.groupId,
    userId: { $in: [...new Set([payerId, ...memberIds])] },
  });
  const validIds = new Set(memberships.map((m) => m.userId.toString()));
  if (!validIds.has(payerId) || !memberIds.every((id) => validIds.has(id))) {
    return res.status(400).json({ error: "Payer and all split members must belong to this group." });
  }

  let shares;
  try {
    shares = buildShares(amount, memberIds, splitType, customShares);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const session = await mongoose.startSession();
  let expense;
  try {
    await session.withTransaction(async () => {
      const created = await Expense.create(
        [
          {
            groupId: req.groupId,
            paidBy: payerId,
            amount: Math.round(amount * 100),
            purpose: description.trim(),
            splitType,
            createdBy: req.userId,
          },
        ],
        { session }
      );
      expense = created[0];

      await ExpenseShare.insertMany(
        shares.map((s) => ({
          expenseId: expense._id,
          userId: s.memberId,
          shareAmount: s.amountCents,
        })),
        { session, ordered: true }
      );
    });
  } finally {
    session.endSession();
  }

  const expenseShares = await ExpenseShare.find({ expenseId: expense._id }).populate("userId", "name");
  res.status(201).json({ expense, shares: expenseShares });
});


const listExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find({ groupId: req.groupId })
    .sort({ createdAt: -1 })
    .populate("paidBy", "name");

  const withShares = await Promise.all(
    expenses.map(async (exp) => {
      const shares = await ExpenseShare.find({ expenseId: exp._id }).populate("userId", "name");
      return { ...exp.toObject(), shares };
    })
  );

  res.json({ expenses: withShares });
});

module.exports = { logExpense, listExpenses };