const test = require("node:test");
const assert = require("node:assert");
const { createGroup } = require("../controllers/groupController");

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (data) { res.body = data; return res; };
  return res;
}

test("createGroup rejects a missing name before touching the DB", async () => {
  const req = { body: { name: "" }, user: { id: "fake-user-id" } };
  const res = mockRes();
  await createGroup(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /name/i);
});

test("createGroup rejects a name over the length limit", async () => {
  const req = { body: { name: "x".repeat(101) }, user: { id: "fake-user-id" } };
  const res = mockRes();
  await createGroup(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /100 characters/i);
});

test("createGroup rejects a name that's just whitespace", async () => {
  const req = { body: { name: "   " }, user: { id: "fake-user-id" } };
  const res = mockRes();
  await createGroup(req, res, () => {});
  assert.equal(res.statusCode, 400);
});