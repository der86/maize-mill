const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB() {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Modern mongoose (8.x) no longer needs useNewUrlParser/useUnifiedTopology,
      // they're defaults, but we keep serverSelectionTimeoutMS to fail fast.
      serverSelectionTimeoutMS: 8000,
      family: 4,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
