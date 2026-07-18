const test = require("node:test");
const assert = require("node:assert");
const { createEvent } = require("../controllers/eventController");

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (data) { res.body = data; return res; };
  return res;
}

function futureStart() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

test("createEvent rejects missing required fields before touching the DB", async () => {
  const req = { body: { title: "Team dinner" }, groupId: "g1", userId: "u1" };
  const res = mockRes();
  await createEvent(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /required/i);
});

test("createEvent rejects a start time in the past", async () => {
  const req = {
    body: { title: "Old event", location: "Room 1", startTime: "2000-01-01T10:00:00Z" },
    groupId: "g1",
    userId: "u1",
  };
  const res = mockRes();
  await createEvent(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /past/i);
});

test("createEvent creates the event and an RSVP record for every member", async (t) => {
  const Event = require("../models/Events");
  const Membership = require("../models/Membership");
  const Rsvp = require("../models/Rsvp");

  const originalCreate = Event.create;
  const originalFind = Membership.find;
  const originalInsertMany = Rsvp.insertMany;
  t.after(() => {
    Event.create = originalCreate;
    Membership.find = originalFind;
    Rsvp.insertMany = originalInsertMany;
  });

  Event.create = async () => ({ _id: "e1", title: "Team dinner" });
  Membership.find = function (query) {
    assert.deepEqual(query, { groupId: "g1" });
    return { select: async () => [{ userId: "u1" }, { userId: "u2" }] };
  };
  let insertedDocs = null;
  Rsvp.insertMany = async (docs) => { insertedDocs = docs; return docs; };

  const req = {
    body: { title: "Team dinner", location: "Room 1", startTime: futureStart() },
    groupId: "g1",
    userId: "u1",
  };
  const res = mockRes();
  let resolveDone;
  const done = new Promise((resolve) => { resolveDone = resolve; });
  const originalJson = res.json;
  res.json = function (data) { originalJson.call(res, data); resolveDone(); return res; };

  createEvent(req, res, (err) => resolveDone(err));
  const maybeError = await done;
  if (maybeError) throw maybeError;

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.event._id, "e1");
  assert.equal(insertedDocs.length, 2);
  assert.deepEqual(insertedDocs.map((d) => d.userId), ["u1", "u2"]);
  assert.ok(insertedDocs.every((d) => d.eventId === "e1" && d.response === "no_response"));
});
