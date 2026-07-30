function buildShares(amount, memberIds, splitType, customShares) {
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    throw new Error("At least one member must be selected for the split.");
  }
  const totalCents = Math.round(amount * 100);
  if (!Number.isFinite(totalCents) || totalCents <= 0) {
    throw new Error("Amount must be a positive number.");
  }

  // ---- Task 15.2 (Milad) - equal split ----
  if (splitType === "equal") {
    const base = Math.floor(totalCents / memberIds.length);
    const remainder = totalCents - base * memberIds.length;
    return memberIds.map((memberId, i) => ({
      memberId,
      amountCents: base + (i < remainder ? 1 : 0),
    }));
  }

  // ---- Task 15.3 (Czarina) - custom split ----
  if (splitType === "custom") {
    if (!customShares || typeof customShares !== "object") {
      throw new Error("customShares is required for a custom split.");
    }
    const shares = memberIds.map((memberId) => {
      const cents = Math.round((customShares[memberId] || 0) * 100);
      return { memberId, amountCents: cents };
    });
    const sum = shares.reduce((acc, s) => acc + s.amountCents, 0);
    if (sum !== totalCents) {
      throw new Error(
        `Custom split must add up exactly to the total. Got ${sum / 100}, expected ${amount}.`
      );
    }
    return shares;
  }

  throw new Error(`Unknown splitType: ${splitType}`);
}

// ---- Task 17.1 (Hunee) - pairwise debt calc / balance netting ----
function calculateNetBalances(expenses) {
  const balances = {};
  const touch = (id) => {
    if (!(id in balances)) balances[id] = 0;
  };

  for (const expense of expenses) {
    touch(expense.payerId);
    for (const share of expense.shares) {
      touch(share.memberId);
      if (share.memberId === expense.payerId) {
        continue;
      }
      balances[share.memberId] -= share.amountCents;
      balances[expense.payerId] += share.amountCents;
    }
  }
  return balances;
}

function simplifyDebts(balances) {
  const creditors = [];
  const debtors = [];
  for (const [id, amount] of Object.entries(balances)) {
    if (amount > 0) creditors.push({ id, amount });
    else if (amount < 0) debtors.push({ id, amount: -amount });
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settled = Math.min(debtor.amount, creditor.amount);
    if (settled > 0) {
      transactions.push({ from: debtor.id, to: creditor.id, amountCents: settled });
    }
    debtor.amount -= settled;
    creditor.amount -= settled;
    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }
  return transactions;
}

module.exports = { buildShares, calculateNetBalances, simplifyDebts };