const test = require("node:test");
const assert = require("node:assert");
const requireMembership = require("../middleware/requireMembership");

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

test("requireMembership blocks a request with no user attached", async () => {
  const req = { params: { groupId: "fake-group-id" }, body: {}, userId: null };
  const res = mockRes();
  let nextCalled = false;

  await requireMembership(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test("requireMembership blocks a user who is not a member of the group", async () => {
  const req = { params: { groupId: "some-group-id" }, body: {}, userId: "not-a-member-id" };
  const res = mockRes();
  let nextCalled = false;

  await requireMembership(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});
