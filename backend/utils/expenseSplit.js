function buildShares(totalAmount, memberIds, splitType = "equal") {
  const amount = Number(totalAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Total amount must be greater than zero.");
  }

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    throw new Error("At least one member is required.");
  }

  if (splitType !== "equal") {
    throw new Error("Only equal split is supported.");
  }

  const totalCents = Math.round(amount * 100);
  const baseShare = Math.floor(totalCents / memberIds.length);
  let remainder = totalCents % memberIds.length;

  return memberIds.map((memberId) => {
    const extraCent = remainder > 0 ? 1 : 0;
    remainder -= extraCent;

    return {
      memberId,
      amountCents: baseShare + extraCent,
    };
  });
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

module.exports = { buildShares };
