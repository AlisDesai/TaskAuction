// TaskAuction/server/config/database.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("connected", () => {
      console.log("📦 Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("📦 Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("📦 Mongoose disconnected from MongoDB");
    });
  } catch (error) {
    console.error("📦 Database connection failed:", error.message);

    // Retry connection after 5 seconds in development
    if (process.env.NODE_ENV === "development") {
      console.log("🔄 Retrying database connection in 5 seconds...");
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
