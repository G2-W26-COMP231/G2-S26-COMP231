const test = require("node:test");
const assert = require("node:assert");
const { reportMessage } = require("../controllers/reportController");

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (data) { res.body = data; return res; };
  return res;
}

test("reportMessage rejects an unknown messageId", async () => {
  const req = {
    params: { messageId: "a-message-that-does-not-exist" },
    body: { reason: "spam" },
    groupId: "fake-group-id",
    userId: "member-id",
  };
  const res = mockRes();
  await reportMessage(req, res, () => {});
  assert.equal(res.statusCode, 404);
  assert.match(res.body.error, /message not found/i);
});