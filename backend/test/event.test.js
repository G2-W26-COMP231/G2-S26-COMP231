const test = require("node:test");
const assert = require("node:assert");
const { createEvent, getUpcomingEvents, getEventRsvps } = require("../controllers/eventController");
const requireOrganizer = require("../middleware/requireOrganizer");

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (data) { res.body = data; return res; };
  return res;
}

test("createEvent rejects a date in the past", async () => {
  const req = {
    body: { title: "Trip", location: "Banff", startTime: "2020-01-01T00:00:00Z" },
    groupId: "fake-group-id",
    userId: "organizer-id",
  };
  const res = mockRes();
  await createEvent(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /past/i);
});

test("createEvent rejects a missing title", async () => {
  const req = {
    body: { location: "Banff", startTime: "2099-01-01T00:00:00Z" },
    groupId: "fake-group-id",
    userId: "organizer-id",
  };
  const res = mockRes();
  await createEvent(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test("getEventRsvps returns 404 for an event that doesn't belong to this group", async () => {
  const req = {
    params: { eventId: "an-event-not-in-this-group" },
    groupId: "fake-group-id",
  };
  const res = mockRes();
  await getEventRsvps(req, res, () => {});
  assert.equal(res.statusCode, 404);
});

test("requireOrganizer blocks a regular member", async () => {
  const req = { membership: { roleInGroup: "member" } };
  const res = mockRes();
  let nextCalled = false;
  requireOrganizer(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test("requireOrganizer allows an organizer through", async () => {
  const req = { membership: { roleInGroup: "organizer" } };
  const res = mockRes();
  let nextCalled = false;
  requireOrganizer(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test("getUpcomingEvents returns events for the group", async () => {
  const req = { groupId: "fake-group-id" };
  const res = mockRes();
  await getUpcomingEvents(req, res, () => {});
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.events));
});