const mongoose = require("mongoose");
const User = require("../models/User");
const Group = require("../models/Group");
const Membership = require("../models/Membership");
const Event = require("../models/Events");
const Message = require("../models/Message");
const Expense = require("../models/Expense");
const Report = require("../models/Report");
const AdminLog = require("../models/AdminLog");
const asyncHandler = require("../utils/asyncHandler");
const { logAdminAction } = require("../utils/adminLog");

const removeUserFromGroup = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({ error: "Group not found." });
  }
  const membership = await Membership.findOneAndDelete({ groupId, userId });
  if (!membership) {
    return res.status(404).json({ error: "This user is not a member of that group." });
  }
  await logAdminAction({
    adminId: req.userId,
    action: "remove_user_from_group",
    targetType: "group",
    targetId: group._id,
    details: `Removed user ${userId} from group ${group.name}`,
  });
  res.json({ removed: true });
});

const getModerationOverview = asyncHandler(async (req, res) => {
  const [openReports, totalReports, bannedUsers, totalUsers, totalGroups] = await Promise.all([
    Report.countDocuments({ status: "open" }),
    Report.countDocuments(),
    User.countDocuments({ status: "banned" }),
    User.countDocuments(),
    Group.countDocuments(),
  ]);
  const recentReports = await Report.find({ status: "open" })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("reportedBy", "name")
    .populate("groupId", "name");
  res.json({
    summary: { openReports, totalReports, bannedUsers, totalUsers, totalGroups },
    recentReports,
  });
});
