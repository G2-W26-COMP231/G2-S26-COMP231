const test = require("node:test");
const assert = require("node:assert");
const Module = require("node:module");

// The admin action log (AdminLog model + logAdminAction util) is Table 33's
// work and isn't in the repo yet. Stub both so this stays a real unit test:
// the logger would otherwise hit the database.
const loggedActions = [];
const originalLoad = Module._load;
Module._load = function (request) {
  if (request === "../models/AdminLog") return {};
  if (request === "../utils/adminLog") {
    return { logAdminAction: async (entry) => { loggedActions.push(entry); } };
  }
  return originalLoad.apply(this, arguments);
};
const { setUserStatus } = require("../controllers/adminController");
Module._load = originalLoad;

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

test("setUserStatus rejects a status other than active or banned", async () => {
  const req = { params: { userId: "u2" }, body: { status: "deleted" }, userId: "admin1" };
  const res = await runHandler(setUserStatus, req);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /active.*banned/i);
});

test("setUserStatus stops an admin from changing their own status", async () => {
  const req = { params: { userId: "admin1" }, body: { status: "banned" }, userId: "admin1" };
  const res = await runHandler(setUserStatus, req);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /your own account/i);
});

test("setUserStatus returns 404 for a user that doesn't exist", async (t) => {
  const User = require("../models/User");
  const original = User.findById;
  t.after(() => { User.findById = original; });
  User.findById = async () => null;

  const req = { params: { userId: "missing" }, body: { status: "banned" }, userId: "admin1" };
  const res = await runHandler(setUserStatus, req);
  assert.equal(res.statusCode, 404);
});

test("setUserStatus bans a user and records the admin action", async (t) => {
  const User = require("../models/User");
  const original = User.findById;
  t.after(() => { User.findById = original; });

  loggedActions.length = 0;
  let saved = false;
  const user = {
    _id: "u2",
    email: "member@example.com",
    status: "active",
    save: async () => { saved = true; },
  };
  User.findById = async () => user;

  const req = { params: { userId: "u2" }, body: { status: "banned" }, userId: "admin1" };
  const res = await runHandler(setUserStatus, req);

  assert.equal(res.statusCode, 200);
  assert.equal(user.status, "banned");
  assert.equal(saved, true);
  assert.equal(loggedActions.length, 1);
  assert.equal(loggedActions[0].action, "ban_user");
  assert.equal(loggedActions[0].targetId, "u2");
});

test("setUserStatus reactivates a banned user", async (t) => {
  const User = require("../models/User");
  const original = User.findById;
  t.after(() => { User.findById = original; });

  loggedActions.length = 0;
  const user = { _id: "u3", email: "back@example.com", status: "banned", save: async () => {} };
  User.findById = async () => user;

  const req = { params: { userId: "u3" }, body: { status: "active" }, userId: "admin1" };
  const res = await runHandler(setUserStatus, req);

  assert.equal(res.statusCode, 200);
  assert.equal(user.status, "active");
  assert.equal(loggedActions[0].action, "reactivate_user");
});
