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

module.exports = { buildShares };