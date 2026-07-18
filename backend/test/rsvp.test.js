const test = require("node:test");
const assert = require("node:assert");
const { submitRsvp } = require("../controllers/rsvpController");

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (data) { res.body = data; return res; };
  return res;
}

test("submitRsvp rejects an invalid response value", async () => {
  const req = {
    params: { eventId: "fake-event-id" },
    body: { response: "not-a-real-status" },
    groupId: "fake-group-id",
    userId: "member-id",
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
  };
  const res = mockRes();

  await submitRsvp(req, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.match(res.body.error, /event not found/i);
});
