const test = require("node:test");
const assert = require("node:assert/strict");
const { buildShares, calculateNetBalances, simplifyDebts } = require("../utils/expenseSplit");

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


test("custom split that adds up exactly to the total is accepted (per M7's acceptance test)", () => {
  const shares = buildShares(100, ["a", "b"], "custom", { a: 60, b: 40 });
  assert.deepEqual(shares, [
    { memberId: "a", amountCents: 6000 },
    { memberId: "b", amountCents: 4000 },
  ]);
});

test("custom split that does NOT add up to the total is rejected (per M7's acceptance test)", () => {
  assert.throws(
    () => buildShares(100, ["a", "b"], "custom", { a: 60, b: 30 }),
    /must add up exactly to the total/
  );
});

test("saving with no members selected is blocked", () => {
  assert.throws(() => buildShares(50, [], "equal"), /at least one member/i);
});

test("net balances credit the payer and debit everyone else", () => {
  const balances = calculateNetBalances([
    { payerId: "a", shares: [{ memberId: "a", amountCents: 1000 }, { memberId: "b", amountCents: 1000 }] },
  ]);
  assert.deepEqual(balances, { a: 1000, b: -1000 });
});

test("the payer's own share never creates a debt to themself", () => {
  const balances = calculateNetBalances([
    { payerId: "a", shares: [{ memberId: "a", amountCents: 2500 }] },
  ]);
  assert.deepEqual(balances, { a: 0 });
});

test("balances net out across expenses and always sum to zero", () => {
  const balances = calculateNetBalances([
    { payerId: "a", shares: [{ memberId: "a", amountCents: 500 }, { memberId: "b", amountCents: 500 }] },
    { payerId: "b", shares: [{ memberId: "a", amountCents: 500 }, { memberId: "b", amountCents: 500 }] },
  ]);
  assert.deepEqual(balances, { a: 0, b: 0 });
  const sum = Object.values(balances).reduce((acc, n) => acc + n, 0);
  assert.equal(sum, 0);
});

test("simplifyDebts turns net balances into who-pays-who transactions", () => {
  const transactions = simplifyDebts({ a: 1000, b: -600, c: -400 });
  const total = transactions.reduce((sum, t) => sum + t.amountCents, 0);
  assert.equal(total, 1000);
  assert.ok(transactions.every((t) => t.to === "a"));
  assert.deepEqual(
    transactions.map((t) => t.from).sort(),
    ["b", "c"]
  );
});

test("simplifyDebts splits one debtor across multiple creditors", () => {
  const transactions = simplifyDebts({ a: -1000, b: 600, c: 400 });
  assert.equal(transactions.length, 2);
  assert.ok(transactions.every((t) => t.from === "a"));
  assert.equal(transactions.reduce((sum, t) => sum + t.amountCents, 0), 1000);
});

test("simplifyDebts returns nothing when everyone is settled up", () => {
  assert.deepEqual(simplifyDebts({ a: 0, b: 0 }), []);
});