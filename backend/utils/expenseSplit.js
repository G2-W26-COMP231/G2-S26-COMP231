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

module.exports = { buildShares };
