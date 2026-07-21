const test = require("node:test");
const assert = require("node:assert");
const { sendMessage, getMessageHistory, persistAndBroadcast } = require("../controllers/messageController");
const initChatSocket = require("../sockets/chatSocket");
const Membership = require("../models/Membership");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

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

function makeIo() {
  const middleware = [];
  const handlers = {};

  return {
    use(fn) {
      middleware.push(fn);
    },
    on(event, handler) {
      handlers[event] = handler;
    },
    middleware,
    handlers,
  };
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

test("socket send blocks users who are not group members", async (t) => {
  const originalFindOne = Membership.findOne;
  const originalFindById = User.findById;
  const originalVerify = jwt.verify;

  t.after(() => {
    Membership.findOne = originalFindOne;
    User.findById = originalFindById;
    jwt.verify = originalVerify;
  });

  jwt.verify = function () {
    return { sub: "user123" };
  };

  User.findById = async function () {
    return { _id: { toString: () => "user123" }, isBanned: false };
  };

  Membership.findOne = async function () {
    return null;
  };

  const io = makeIo();
  initChatSocket(io);

  const socket = {
    handshake: { auth: { token: "fake-token" } },
    onHandlers: {},
    on(event, handler) {
      this.onHandlers[event] = handler;
    },
    join() {},
    leave() {},
  };

  await io.middleware[0](socket, () => {});
  io.handlers.connection(socket);

  let ackResponse = null;

  await socket.onHandlers["message:send"](
    { groupId: "group123", body: "hello" },
    (ack) => {
      ackResponse = ack;
    }
  );

  assert.deepEqual(ackResponse, {
    error: "You are not a member of this group.",
  });
});
