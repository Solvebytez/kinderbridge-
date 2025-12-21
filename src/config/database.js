const mongoose = require('mongoose');

/**
 * MongoDB Connection using Mongoose
 */
let isConnected = false;

async function connectToMongoDB() {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected via Mongoose');
      return mongoose.connection;
    }

    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not configured');
    }

    // Fix the connection string format (remove any angle brackets if present)
    let mongoUri = MONGODB_URI.replace(/[<>]/g, '');

    // Extract database name from URI or use default
    const dbName = process.env.DB_NAME || 'daycare_concierge';

    console.log('🔌 Connecting to MongoDB Atlas with Mongoose...');
    console.log(`📡 Database: ${dbName}`);

    await mongoose.connect(mongoUri, {
      dbName: dbName,
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    isConnected = true;
    console.log('✅ MongoDB connected successfully with Mongoose');
    console.log(`🗄️ Database: ${mongoose.connection.db.databaseName}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    isConnected = false;
    throw error;
  }
}

function disconnectFromMongoDB() {
  if (isConnected) {
    mongoose.disconnect();
    isConnected = false;
    console.log('🔌 Disconnected from MongoDB');
  }
}

module.exports = {
  connectToMongoDB,
  disconnectFromMongoDB,
  mongoose
};

