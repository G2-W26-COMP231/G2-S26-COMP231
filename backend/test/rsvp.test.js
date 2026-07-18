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

function mockApp() {
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

test("submitRsvp emits a Socket.io update after saving", async (t) => {
  const Event = require("../models/Event");
  const Rsvp = require("../models/Rsvp");

  const originalFindOne = Event.findOne;
  const originalFindOneAndUpdate = Rsvp.findOneAndUpdate;

  t.after(() => {
    Event.findOne = originalFindOne;
    Rsvp.findOneAndUpdate = originalFindOneAndUpdate;
  });

  Event.findOne = async function () {
    return { _id: "fake-event-id", groupId: "fake-group-id" };
  };

  Rsvp.findOneAndUpdate = async function () {
    return {
      eventId: "fake-event-id",
      userId: "member-id",
      response: "going",
    };
  };

  let emittedRoom = null;
  let emittedEvent = null;
  let emittedPayload = null;

  const io = {
    to(room) {
      emittedRoom = room;
      return {
        emit(eventName, payload) {
          emittedEvent = eventName;
          emittedPayload = payload;
        },
      };
    },
  };

  const req = {
    params: { eventId: "fake-event-id" },
    body: { response: "going" },
    groupId: "fake-group-id",
    userId: "member-id",
    app: { get: () => io },
  };
  const res = mockRes();

  await submitRsvp(req, res, () => {});

  assert.equal(emittedRoom, "group:fake-group-id");
  assert.equal(emittedEvent, "rsvp:update");
  assert.deepEqual(emittedPayload, {
    eventId: "fake-event-id",
    userId: "member-id",
    response: "going",
  });
});
