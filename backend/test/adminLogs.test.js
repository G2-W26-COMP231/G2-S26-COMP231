const test = require("node:test");
const assert = require("node:assert");
const { getAdminLogs } = require("../controllers/adminController");

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

function mockAdminLogFind(entries, captured) {
  const AdminLog = require("../models/AdminLog");
  AdminLog.find = function () {
    return {
      sort: (sortSpec) => {
        captured.sort = sortSpec;
        return {
          limit: (n) => {
            captured.limit = n;
            return { populate: async (field) => { captured.populate = field; return entries; } };
          },
        };
      },
    };
  };
}

test("getAdminLogs returns entries newest first", async (t) => {
  const AdminLog = require("../models/AdminLog");
  const original = AdminLog.find;
  t.after(() => { AdminLog.find = original; });

  const captured = {};
  const entries = [{ _id: "l2", action: "ban_user" }, { _id: "l1", action: "remove_user_from_group" }];
  mockAdminLogFind(entries, captured);

  const res = await runHandler(getAdminLogs, { query: {} });

  assert.deepEqual(captured.sort, { createdAt: -1 });
  assert.equal(captured.populate, "adminId");
  assert.deepEqual(res.body.logs, entries);
});

test("getAdminLogs defaults to a limit of 50", async (t) => {
  const AdminLog = require("../models/AdminLog");
  const original = AdminLog.find;
  t.after(() => { AdminLog.find = original; });

  const captured = {};
  mockAdminLogFind([], captured);

  await runHandler(getAdminLogs, { query: {} });
  assert.equal(captured.limit, 50);
});

test("getAdminLogs honours a requested limit", async (t) => {
  const AdminLog = require("../models/AdminLog");
  const original = AdminLog.find;
  t.after(() => { AdminLog.find = original; });

  const captured = {};
  mockAdminLogFind([], captured);

  await runHandler(getAdminLogs, { query: { limit: "10" } });
  assert.equal(captured.limit, 10);
});

test("getAdminLogs caps the limit at 200", async (t) => {
  const AdminLog = require("../models/AdminLog");
  const original = AdminLog.find;
  t.after(() => { AdminLog.find = original; });

  const captured = {};
  mockAdminLogFind([], captured);

  await runHandler(getAdminLogs, { query: { limit: "5000" } });
  assert.equal(captured.limit, 200);
});

test("getAdminLogs falls back to 50 for a non-numeric limit", async (t) => {
  const AdminLog = require("../models/AdminLog");
  const original = AdminLog.find;
  t.after(() => { AdminLog.find = original; });

  const captured = {};
  mockAdminLogFind([], captured);

  await runHandler(getAdminLogs, { query: { limit: "abc" } });
  assert.equal(captured.limit, 50);
});
