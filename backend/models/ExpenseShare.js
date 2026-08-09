const mongoose = require("mongoose");

/** One person's share of an Expense - who owes how much. */
const expenseShareSchema = new mongoose.Schema({
  expenseId: { type: mongoose.Schema.Types.ObjectId, ref: "Expense", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shareAmount: { type: Number, required: true, min: 0 },
});

expenseShareSchema.index({ expenseId: 1 });
expenseShareSchema.index({ expenseId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("ExpenseShare", expenseShareSchema);