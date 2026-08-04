const test = require("node:test");
const assert = require("node:assert");
const { getRecentMessages } = require("../controllers/notificationController");

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (data) { res.body = data; return res; };
  return res;
}

function runHandler(handler, req) {
  const res = mockRes();
  let resolveDone;
  const done = new Promise((resolve) => { resolveDone = resolve; });
  const originalJson = res.json;
  res.json = function (data) { originalJson.call(res, data); resolveDone(); return res; };
  handler(req, res, (err) => resolveDone(err));
  return done.then((maybeError) => {
    if (maybeError) throw maybeError;
    return res;
  });
}

function mockMessage(id, groupId, groupName) {
  return {
    _id: id,
    content: `message ${id}`,
    groupId: { _id: { toString: () => groupId }, name: groupName },
  };
}

test("getRecentMessages returns nothing when the user has no group memberships", async (t) => {
  const Membership = require("../models/Membership");
  const original = Membership.find;
  t.after(() => { Membership.find = original; });

  Membership.find = function (query) {
    assert.deepEqual(query, { userId: "u1" });
    return { select: async () => [] };
  };

  const res = await runHandler(getRecentMessages, { userId: "u1" });
  assert.deepEqual(res.body, { messages: [] });
});

test("getRecentMessages keeps only the latest message per group", async (t) => {
  const Membership = require("../models/Membership");
  const Message = require("../models/Message");
  const originalMembershipFind = Membership.find;
  const originalMessageFind = Message.find;
  t.after(() => {
    Membership.find = originalMembershipFind;
    Message.find = originalMessageFind;
  });

  Membership.find = () => ({ select: async () => [{ groupId: "g1" }, { groupId: "g2" }] });

  let capturedQuery = null;
  let capturedSort = null;
  Message.find = function (query) {
    capturedQuery = query;
    return {
      sort: (sortSpec) => {
        capturedSort = sortSpec;
        return {
          limit: () => ({
            populate: () => ({
              populate: async () => [
                mockMessage("m3", "g1", "Trip"),
                mockMessage("m2", "g1", "Trip"),
                mockMessage("m1", "g2", "Study"),
              ],
            }),
          }),
        };
      },
    };
  };

  const res = await runHandler(getRecentMessages, { userId: "u1" });

  assert.equal(capturedQuery.isRemoved, false);
  assert.deepEqual(capturedSort, { sentAt: -1 });
  assert.deepEqual(res.body.messages.map((m) => m._id), ["m3", "m1"]);
});

test("getRecentMessages caps the dropdown at 10 groups", async (t) => {
  const Membership = require("../models/Membership");
  const Message = require("../models/Message");
  const originalMembershipFind = Membership.find;
  const originalMessageFind = Message.find;
  t.after(() => {
    Membership.find = originalMembershipFind;
    Message.find = originalMessageFind;
  });

  const many = Array.from({ length: 15 }, (_, i) => mockMessage(`m${i}`, `g${i}`, `Group ${i}`));
  Membership.find = () => ({ select: async () => many.map((_, i) => ({ groupId: `g${i}` })) });
  Message.find = () => ({
    sort: () => ({ limit: () => ({ populate: () => ({ populate: async () => many }) }) }),
  });

  const res = await runHandler(getRecentMessages, { userId: "u1" });
  assert.equal(res.body.messages.length, 10);
});
