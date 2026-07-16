const express = require("express");
const cors = require("cors");
const invitationRoutes = require('./routes/invitationRoutes');

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    })
  );

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", (req, res) => {
    res.status(404).json({ error: "Not found." });
  });

  app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
      error: err.message || "Something went wrong.",
    });
  });

  app.use('/api/groups/:groupId/invitations', invitationRoutes);

  return app;
}

module.exports = createApp;