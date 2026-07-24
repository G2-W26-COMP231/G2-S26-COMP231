const express = require("express");
const cors = require("cors");

const requireAuth = require("./middleware/auth");
const authRoutes = require("./routes/authRoutes");
const groupRoutes = require("./routes/groupRoutes");
const { groupInvitationRouter, acceptInvitationRouter } = require("./routes/invitationRoutes");
const eventRoutes = require("./routes/eventRoutes");
const messageRoutes = require("./routes/messageRoutes");
const expenseRoutes = require("./routes/expenseRoutes");

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", credentials: true }));
  app.use(express.json());
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api", requireAuth);
  app.use("/api/groups", groupRoutes);
  app.use("/api/groups/:groupId/invitations", groupInvitationRouter);
  app.use("/api/invitations", acceptInvitationRouter);
  app.use("/api/groups/:groupId/events", eventRoutes);
  app.use("/api/groups/:groupId/messages", messageRoutes);
  app.use("/api/groups/:groupId/expenses", expenseRoutes);

  app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

  app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({ error: status === 500 ? "Something went wrong." : err.message });
  });

  return app;
}

module.exports = createApp;