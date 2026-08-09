/**
 * Figures out how much each person owes for an expense, either split
 * equally or with custom amounts. Everything's done in cents to avoid
 * floating point rounding issues. For an equal split, any leftover cents
 * (like $10 split 3 ways = $3.33 each with 1 cent left over) get handed
 * out one at a time to the first few people instead of just getting lost.
 *
 * @param {number} amount - total amount in dollars
 * @param {string[]} memberIds - who's included in the split
 * @param {"equal"|"custom"} splitType
 * @param {Object} [customShares] - required if splitType is "custom", maps memberId -> dollar amount
 * @returns {{memberId: string, amountCents: number}[]}
 */
function buildShares(amount, memberIds, splitType, customShares) {
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    throw new Error("At least one member must be selected for the split.");
  }
  const totalCents = Math.round(amount * 100);
  if (!Number.isFinite(totalCents) || totalCents <= 0) {
    throw new Error("Amount must be a positive number.");
  }

  if (splitType === "equal") {
    const base = Math.floor(totalCents / memberIds.length);
    const remainder = totalCents - base * memberIds.length;
    return memberIds.map((memberId, i) => ({
      memberId,
      amountCents: base + (i < remainder ? 1 : 0),
    }));
  }

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

module.exports = { buildShares };