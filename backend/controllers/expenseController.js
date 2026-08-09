const mongoose = require("mongoose");
const Membership = require("../models/Membership");
const Expense = require("../models/Expense");
const ExpenseShare = require("../models/ExpenseShare");
const asyncHandler = require("../utils/asyncHandler");
const { buildShares } = require("../utils/expenseSplit");

/**
 * Organizer logs a new shared expense and splits it among selected members
 * (either equally or with custom amounts - buildShares handles the actual
 * math). Makes sure the payer and everyone being split with are actually
 * in the group before doing anything. Runs in a transaction since we're
 * creating the Expense and all its ExpenseShare records together and don't
 * want one to succeed without the other.
 *
 * @param {Object} req - needs description, amount, payerId, memberIds[], splitType, optional customShares
 * @param {Object} res
 */
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

/**
 * Lists all the expenses logged in a group, newest first, with each
 * expense's individual shares attached so the frontend can show who owes
 * what for each one. Open to all members, not just the organizer.
 *
 * @param {Object} req
 * @param {Object} res
 */
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

/**
 * The "who owes who" calculation. Goes through every expense share in the
 * group and figures out, pairwise, how much each person owes each other
 * person. Then nets it down so if A owes B $10 but B also owes A $4 from a
 * different expense, we just show "A owes B $6" instead of two separate
 * lines. Also returns everyone's overall net balance and specifically the
 * logged-in user's own balance and debts, since that's what the personal
 * balance card on the frontend needs.
 *
 * @param {Object} req
 * @param {Object} res
 */
const getBalances = asyncHandler(async (req, res) => {
  const expenses = await Expense.find({ groupId: req.groupId }).select("_id paidBy amount");
  const expenseIds = expenses.map((e) => e._id);
  const payerByExpense = new Map(expenses.map((e) => [e._id.toString(), e.paidBy.toString()]));

  const shares = await ExpenseShare.find({ expenseId: { $in: expenseIds } });

  const pairwise = {};
  const addDebt = (debtor, creditor, cents) => {
    if (debtor === creditor || cents <= 0) return;
    pairwise[debtor] = pairwise[debtor] || {};
    pairwise[debtor][creditor] = (pairwise[debtor][creditor] || 0) + cents;
  };

  for (const share of shares) {
    const expenseId = share.expenseId.toString();
    const payer = payerByExpense.get(expenseId);
    const debtor = share.userId.toString();
    if (!payer) continue;
    addDebt(debtor, payer, share.shareAmount);
  }

  const userIds = new Set();
  Object.keys(pairwise).forEach((d) => {
    userIds.add(d);
    Object.keys(pairwise[d]).forEach((c) => userIds.add(c));
  });

  const owes = [];
  const seen = new Set();
  for (const a of userIds) {
    for (const b of userIds) {
      if (a === b) continue;
      const key = [a, b].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const aOwesB = pairwise[a]?.[b] || 0;
      const bOwesA = pairwise[b]?.[a] || 0;
      const net = aOwesB - bOwesA;
      if (net > 0) owes.push({ from: a, to: b, amountCents: net });
      else if (net < 0) owes.push({ from: b, to: a, amountCents: -net });
    }
  }

  const netBalance = {};
  owes.forEach(({ from, to, amountCents }) => {
    netBalance[from] = (netBalance[from] || 0) - amountCents;
    netBalance[to] = (netBalance[to] || 0) + amountCents;
  });

  const memberIds = [...new Set([...userIds, req.userId])];
  const memberships = await Membership.find({ groupId: req.groupId, userId: { $in: memberIds } }).populate(
    "userId",
    "name email"
  );
  const nameById = new Map(memberships.filter((m) => m.userId).map((m) => [m.userId._id.toString(), m.userId.name]));

  const owesNamed = owes.map((o) => ({
    fromUserId: o.from,
    fromName: nameById.get(o.from) || "Unknown",
    toUserId: o.to,
    toName: nameById.get(o.to) || "Unknown",
    amount: o.amountCents / 100,
  }));

  const balances = Object.entries(netBalance).map(([userId, cents]) => ({
    userId,
    name: nameById.get(userId) || "Unknown",
    balance: cents / 100,
  }));

  res.json({
    balances,
    owes: owesNamed,
    myBalance: (netBalance[req.userId] || 0) / 100,
    myDebts: owesNamed.filter((o) => o.fromUserId === req.userId || o.toUserId === req.userId),
  });
});

module.exports = { logExpense, listExpenses, getBalances };