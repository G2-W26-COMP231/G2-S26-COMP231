const test = require("node:test");
const assert = require("node:assert/strict");
const { buildShares } = require("../utils/expenseSplit");

test("equal split divides evenly with no remainder", () => {
  const shares = buildShares(30, ["a", "b", "c"], "equal");
  const total = shares.reduce((sum, s) => sum + s.amountCents, 0);

  assert.equal(total, 3000);
  assert.deepEqual(shares.map((s) => s.amountCents), [1000, 1000, 1000]);
});

test("equal split with a remainder distributes leftover cents instead of losing them", () => {
  const shares = buildShares(10, ["a", "b", "c"], "equal");
  const total = shares.reduce((sum, s) => sum + s.amountCents, 0);

  assert.equal(total, 1000);
  assert.deepEqual(
    shares.map((s) => s.amountCents).sort((x, y) => y - x),
    [334, 333, 333]
  );
});

test("saving with no members selected is blocked", () => {
  assert.throws(() => buildShares(50, [], "equal"), /at least one member/i);
});
