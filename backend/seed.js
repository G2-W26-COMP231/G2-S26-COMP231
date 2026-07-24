require("dotenv").config();
const mongoose = require("mongoose");
const { seedDatabase } = require("./utils/seedData");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");
  await seedDatabase({ wipeFirst: true });
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});