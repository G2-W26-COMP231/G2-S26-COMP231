require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const createApp = require("./app");
const initChatSocket = require("./sockets/chatSocket");
const User = require("./models/User");
const { seedDatabase } = require("./utils/seedData");

async function seedIfEmpty() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log("Database is empty - seeding demo data automatically...");
    await seedDatabase({ wipeFirst: false });
  }
}

async function start() {
  await connectDB();
  await seedIfEmpty();

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" },
  });
  app.set("io", io); 
  initChatSocket(io);

  const port = process.env.PORT || 5000;
  httpServer.listen(port, () => {
    console.log(`CrewUp API listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});