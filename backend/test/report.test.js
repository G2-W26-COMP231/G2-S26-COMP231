/** Tests for reportMessage - just the "message doesn't exist" case. */
const test = require("node:test");
const assert = require("node:assert");
const { reportMessage } = require("../controllers/reportController");
const Message = require("../models/Message");

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (data) { res.body = data; return res; };
  return res;
}

test("reportMessage rejects an unknown messageId", async (t) => {
  const original = Message.findOne;
  t.after(() => { Message.findOne = original; });
  Message.findOne = async () => null;

  const req = {
    params: { messageId: "64a1f0000000000000000006" },
    body: { reason: "spam" },
    groupId: "64a1f0000000000000000001",
    userId: "64a1f0000000000000000007",
  };
  const res = mockRes();
  await reportMessage(req, res, () => {});
  assert.equal(res.statusCode, 404);
  assert.match(res.body.error, /message not found/i);
});