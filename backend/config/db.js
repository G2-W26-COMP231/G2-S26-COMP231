const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the connection string from the .env file.
 * Throws right away if MONGO_URI isn't set so we get a clear error instead
 * of some confusing mongoose error later on. Called once when the server
 * starts up in server.js.
 *
 * @returns {Promise<void>}
 */
async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from the .env file.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  console.log(
    `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`
  );
}

module.exports = connectDB;