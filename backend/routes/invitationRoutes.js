const express = require("express");
const requireMembership = require("../middleware/requireMembership");
const requireOrganizer = require("../middleware/requireOrganizer");
const {
  inviteMember,
  listPendingInvites,
  listMyInvitations,
  acceptInvitation,
  declineInvitation,
  listInviteResponses,
  markInviteResponsesSeen,
} = require("../controllers/invitationController");

/**
 * Two separate routers here since invites are accessed two different ways:
 * groupInvitationRouter is nested under a group (organizer-only, for
 * sending/listing invites for that group), while acceptInvitationRouter
 * is standalone (for the person receiving the invite - accept/decline/
 * check their own pending invites, no group membership needed yet).
 */
const groupInvitationRouter = express.Router({ mergeParams: true });
groupInvitationRouter.use(requireMembership, requireOrganizer);
groupInvitationRouter.post("/", inviteMember);
groupInvitationRouter.get("/", listPendingInvites);

const acceptInvitationRouter = express.Router();
acceptInvitationRouter.get("/mine", listMyInvitations);
acceptInvitationRouter.get("/responses", listInviteResponses);
acceptInvitationRouter.post("/responses/seen", markInviteResponsesSeen);
acceptInvitationRouter.post("/:token/accept", acceptInvitation);
acceptInvitationRouter.post("/:token/decline", declineInvitation);

module.exports = { groupInvitationRouter, acceptInvitationRouter };