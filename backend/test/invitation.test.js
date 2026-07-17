const test = require("node:test");
const assert = require("node:assert");

const Invitation = require("../models/Invitation");
const Membership = require("../models/Membership");

const {
  inviteMember,
  acceptInvitation,
} = require("../controllers/invitationController");

function mockRes() {
  const res = {};

  res.statusCode = 200;
  res.body = null;

  res.status = function (code) {
    res.statusCode = code;
    return res;
  };

  res.json = function (data) {
    res.body = data;
    return res;
  };

  return res;
}

test("inviteMember rejects an invalid email", async () => {
  const req = {
    body: {
      email: "not-an-email",
    },
    groupId: "fake-group-id",
    userId: "organizer-id",
    user: {
      name: "Organizer",
    },
  };

  const res = mockRes();

  await inviteMember(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /valid email/i);
});

test("inviteMember rejects a missing email", async () => {
  const req = {
    body: {},
    groupId: "fake-group-id",
    userId: "organizer-id",
    user: {
      name: "Organizer",
    },
  };

  const res = mockRes();

  await inviteMember(req, res, () => {});

  assert.equal(res.statusCode, 400);
});

test("acceptInvitation accepts a valid pending invitation", async () => {
  const originalInvitationFindOne = Invitation.findOne;
  const originalMembershipFindOne = Membership.findOne;
  const originalMembershipCreate = Membership.create;

  const fakeInvitation = {
    token: "valid-token",
    groupId: "group-id",
    email: "someone@example.com",
    status: "pending",

    isExpired() {
      return false;
    },

    async save() {
      return this;
    },
  };

  let createdMembership = null;

  Invitation.findOne = async () => fakeInvitation;
  Membership.findOne = async () => null;

  Membership.create = async (membership) => {
    createdMembership = membership;
    return membership;
  };

  try {
    const req = {
      params: {
        token: "valid-token",
      },
      userId: "user-id",
      user: {
        email: "someone@example.com",
      },
    };

    const res = mockRes();

    await acceptInvitation(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.equal(fakeInvitation.status, "accepted");
    assert.equal(res.body.groupId, "group-id");

    assert.deepEqual(createdMembership, {
      groupId: "group-id",
      userId: "user-id",
      roleInGroup: "member",
    });
  } finally {
    Invitation.findOne = originalInvitationFindOne;
    Membership.findOne = originalMembershipFindOne;
    Membership.create = originalMembershipCreate;
  }
});

test("acceptInvitation rejects an unknown token", async () => {
  const originalFindOne = Invitation.findOne;

  Invitation.findOne = async () => null;

  try {
    const req = {
      params: {
        token: "not-a-real-token",
      },
      userId: "user-id",
      user: {
        email: "someone@example.com",
      },
    };

    const res = mockRes();

    await acceptInvitation(req, res, () => {});

    assert.equal(res.statusCode, 404);
    assert.match(res.body.error, /invalid/i);
  } finally {
    Invitation.findOne = originalFindOne;
  }
});

test("acceptInvitation rejects an invitation sent to another email", async () => {
  const originalFindOne = Invitation.findOne;

  Invitation.findOne = async () => ({
    groupId: "group-id",
    email: "different@example.com",
    status: "pending",

    isExpired() {
      return false;
    },

    async save() {
      return this;
    },
  });

  try {
    const req = {
      params: {
        token: "valid-token",
      },
      userId: "user-id",
      user: {
        email: "someone@example.com",
      },
    };

    const res = mockRes();

    await acceptInvitation(req, res, () => {});

    assert.equal(res.statusCode, 403);
    assert.match(res.body.error, /different email/i);
  } finally {
    Invitation.findOne = originalFindOne;
  }
});

test("acceptInvitation rejects an already accepted invitation", async () => {
  const originalFindOne = Invitation.findOne;

  Invitation.findOne = async () => ({
    status: "accepted",
  });

  try {
    const req = {
      params: {
        token: "valid-token",
      },
      userId: "user-id",
      user: {
        email: "someone@example.com",
      },
    };

    const res = mockRes();

    await acceptInvitation(req, res, () => {});

    assert.equal(res.statusCode, 409);
    assert.match(res.body.error, /already been accepted/i);
  } finally {
    Invitation.findOne = originalFindOne;
  }
});

test("acceptInvitation rejects an expired invitation", async () => {
  const originalFindOne = Invitation.findOne;

  const fakeInvitation = {
    groupId: "group-id",
    email: "someone@example.com",
    status: "pending",

    isExpired() {
      return true;
    },

    async save() {
      return this;
    },
  };

  Invitation.findOne = async () => fakeInvitation;

  try {
    const req = {
      params: {
        token: "expired-token",
      },
      userId: "user-id",
      user: {
        email: "someone@example.com",
      },
    };

    const res = mockRes();

    await acceptInvitation(req, res, () => {});

    assert.equal(res.statusCode, 410);
    assert.equal(fakeInvitation.status, "expired");
    assert.match(res.body.error, /expired/i);
  } finally {
    Invitation.findOne = originalFindOne;
  }
})