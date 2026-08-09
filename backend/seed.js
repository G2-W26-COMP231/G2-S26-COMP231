/**
 * Standalone script to wipe and reseed the database with demo data.
 * Run manually with `node seed.js`, separate from the auto-seed that
 * happens on server startup if the DB is empty.
 */
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