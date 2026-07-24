const test = require("node:test");
const assert = require("node:assert");
const { submitRsvp, getMyRsvp } = require("../controllers/rsvpController");

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (data) { res.body = data; return res; };
  return res;
}

function mockApp() {
  // submitRsvp calls req.app.get("io") - mock it so the emit doesn't crash
  // when no real Socket.io server is running during tests
  return { get: () => null };
}

test("submitRsvp rejects an invalid response value", async () => {
  const req = {
    params: { eventId: "fake-event-id" },
    body: { response: "not-a-real-status" },
    groupId: "fake-group-id",
    userId: "member-id",
    app: mockApp(),
  };
  const res = mockRes();
  await submitRsvp(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /response must be one of/i);
});

test("submitRsvp rejects a missing response", async () => {
  const req = {
    params: { eventId: "fake-event-id" },
    body: {},
    groupId: "fake-group-id",
    userId: "member-id",
    app: mockApp(),
  };
  const res = mockRes();
  await submitRsvp(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test("submitRsvp rejects an unknown event", async () => {
  const req = {
    params: { eventId: "an-event-that-does-not-exist" },
    body: { response: "going" },
    groupId: "fake-group-id",
    userId: "member-id",
    app: mockApp(),
  };
  const res = mockRes();
  await submitRsvp(req, res, () => {});
  assert.equal(res.statusCode, 404);
  assert.match(res.body.error, /event not found/i);
});

test("getMyRsvp returns no_response when the user hasn't RSVP'd yet", async () => {
  const req = {
    params: { eventId: "an-event-with-no-rsvp-yet" },
    userId: "member-id",
  };
  const res = mockRes();
  await getMyRsvp(req, res, () => {});
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.rsvp.response, "no_response");
});