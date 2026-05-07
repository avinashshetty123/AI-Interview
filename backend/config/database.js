const mongoose = require('mongoose');

let cachedConnection = null;
let cachedConnectionPromise = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (cachedConnectionPromise) {
    return cachedConnectionPromise;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri && process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is required in production');
  }

  try {
    cachedConnectionPromise = mongoose.connect(mongoUri || 'mongodb://localhost:27017/jankoti-interview', {
      serverSelectionTimeoutMS: 10000
    });

    const conn = await cachedConnectionPromise;
    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    cachedConnectionPromise = null;
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

module.exports = connectDB;
