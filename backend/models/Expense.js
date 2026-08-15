const mongoose = require("mongoose");
const { EXPENSE_PURPOSE_MAX_LENGTH } = require("../utils/limits");

/** One logged expense. amount is stored in cents to avoid rounding issues. */
const expenseSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 }, // integer cents
    purpose: { type: String, required: true, trim: true, maxlength: EXPENSE_PURPOSE_MAX_LENGTH },
    splitType: { type: String, enum: ["equal", "custom"], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);