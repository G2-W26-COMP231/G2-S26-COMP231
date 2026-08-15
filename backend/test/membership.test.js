/** Tests for the requireMembership middleware. */
const test = require("node:test");
const assert = require("node:assert");
const requireMembership = require("../middleware/requireMembership");
const Membership = require("../models/Membership");

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;

  res.status = function (code) {
    res.statusCode = code;
    return res;
  };

  res.json = function (data) {
    res.body = data;
    return res;
  };

  return res;
}

// requireMembership doesn't check req.userId being falsy on its own - a
// null userId just queries Membership.findOne({groupId, userId: null}),
// finds nothing (mocked below), and falls into the generic 403 "not a
// member" branch. Asserting the real behavior here instead of a 401 that
// the middleware was never written to produce.
test("requireMembership blocks a request with no user attached", async (t) => {
  const original = Membership.findOne;
  t.after(() => { Membership.findOne = original; });
  Membership.findOne = async () => null;

  const req = { params: { groupId: "64a1f0000000000000000001" }, body: {}, userId: null };
  const res = mockRes();
  let nextCalled = false;

  await requireMembership(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test("requireMembership blocks a user who is not a member of the group", async (t) => {
  const original = Membership.findOne;
  t.after(() => { Membership.findOne = original; });
  Membership.findOne = async () => null;

  const req = { params: { groupId: "64a1f0000000000000000004" }, body: {}, userId: "64a1f0000000000000000005" };
  const res = mockRes();
  let nextCalled = false;

  await requireMembership(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});