/** Tests for submitRsvp and getMyRsvp. */
const test = require("node:test");
const assert = require("node:assert");
const { submitRsvp, getMyRsvp } = require("../controllers/rsvpController");
const Event = require("../models/Events");
const Rsvp = require("../models/Rsvp");

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

test("submitRsvp rejects an invalid response value", async () => {
  const req = {
    params: { eventId: "64a1f0000000000000000008" },
    body: { response: "not-a-real-status" },
    groupId: "64a1f0000000000000000001",
    userId: "64a1f0000000000000000007",
    app: mockApp(),
  };
  const res = mockRes();
  await submitRsvp(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /response must be one of/i);
});

test("submitRsvp rejects a missing response", async () => {
  const req = {
    params: { eventId: "64a1f0000000000000000008" },
    body: {},
    groupId: "64a1f0000000000000000001",
    userId: "64a1f0000000000000000007",
    app: mockApp(),
  };
  const res = mockRes();
  await submitRsvp(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test("submitRsvp rejects an unknown event", async (t) => {
  const original = Event.findOne;
  t.after(() => { Event.findOne = original; });
  Event.findOne = async () => null;

  const req = {
    params: { eventId: "64a1f0000000000000000009" },
    body: { response: "going" },
    groupId: "64a1f0000000000000000001",
    userId: "64a1f0000000000000000007",
    app: mockApp(),
  };
  const res = mockRes();
  await submitRsvp(req, res, () => {});
  assert.equal(res.statusCode, 404);
  assert.match(res.body.error, /event not found/i);
});

test("getMyRsvp returns no_response when the user hasn't RSVP'd yet", async (t) => {
  const original = Rsvp.findOne;
  t.after(() => { Rsvp.findOne = original; });
  Rsvp.findOne = async () => null;

  const req = {
    params: { eventId: "64a1f000000000000000000a" },
    userId: "64a1f0000000000000000007",
  };
  const res = mockRes();
  await getMyRsvp(req, res, () => {});
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.rsvp.response, "no_response");
});