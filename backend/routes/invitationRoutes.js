const express = require("express");
const requireMembership = require("../middleware/requireMembership");
const requireOrganizer = require("../middleware/requireOrganizer");
const {
  inviteMember,
  listPendingInvites,
  listMyInvitations,
  acceptInvitation,
} = require("../controllers/invitationController");

const groupInvitationRouter = express.Router({ mergeParams: true });
groupInvitationRouter.use(requireMembership, requireOrganizer);
groupInvitationRouter.post("/", inviteMember);
groupInvitationRouter.get("/", listPendingInvites);

const acceptInvitationRouter = express.Router();
acceptInvitationRouter.get("/mine", listMyInvitations);
acceptInvitationRouter.post("/:token/accept", acceptInvitation);

module.exports = { groupInvitationRouter, acceptInvitationRouter };