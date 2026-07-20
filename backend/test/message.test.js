const test = require("node:test");
const assert = require("node:assert");
const { sendMessage, getMessageHistory, persistAndBroadcast } = require("../controllers/messageController");

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (data) { res.body = data; return res; };
  return res;
}

function mockApp() {
  return { get: () => null };
}

test("persistAndBroadcast rejects an empty message", async () => {
  await assert.rejects(
    () => persistAndBroadcast({ groupId: "fake-group-id", senderId: "fake-user-id", body: "   ", io: null }),
    /cannot be empty/i
  );
});

test("persistAndBroadcast rejects a message over 2000 characters", async () => {
  await assert.rejects(
    () => persistAndBroadcast({ groupId: "fake-group-id", senderId: "fake-user-id", body: "x".repeat(2001), io: null }),
    /too long/i
  );
});

test("sendMessage rejects an empty body via the REST fallback", async () => {
  const req = { groupId: "fake-group-id", userId: "fake-user-id", body: { body: "" }, app: mockApp() };
  const res = mockRes();
  await sendMessage(req, res, () => {});
  assert.equal(res.statusCode, 400);
});