const app = require('./app');
const { connectToMongoDB } = require('./config/database');
const { databaseMiddleware } = require('./middleware/database');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 5001;

// Global variables for database state
let db = null;
let isMongoConnected = false;
let mongoClient = null;

// MongoDB connection function with production optimizations (for backward compatibility)
async function connectToMongoDBNative() {
  try {
    console.log('🔌 Attempting to connect to MongoDB Atlas (native driver)...');
    console.log('📡 MongoDB URI:', process.env.MONGODB_URI ? 'Configured' : 'Missing');
    console.log('🗄️ Database Name:', process.env.DB_NAME || 'daycare_concierge');

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not configured');
    }

    // Fix the connection string format (remove any angle brackets if present)
    let mongoUri = process.env.MONGODB_URI.replace(/[<>]/g, '');

    mongoClient = new MongoClient(mongoUri, {
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
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
    });

    await mongoClient.connect();
    db = mongoClient.db(process.env.DB_NAME || 'daycare_concierge');
    isMongoConnected = true;

    console.log('✅ Successfully connected to MongoDB Atlas (native driver)');
    console.log(`🗄️ Database: ${db.databaseName}`);

    // Test database access
    const collections = await db.listCollections().toArray();
    console.log(`📚 Available collections: ${collections.map((c) => c.name).join(', ')}`);

    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    isMongoConnected = false;
    return false;
  }
}

// Initialize Mongoose connection
async function initializeMongoose() {
  try {
    const { initializeMongoose: initMongoose } = require('./config/mongooseInit');
    await initMongoose();
    console.log('✅ Mongoose initialized');
    return true;
  } catch (error) {
    console.error('❌ Mongoose initialization failed:', error.message);
    return false;
  }
}

// Start server
async function startServer() {
  console.log('🚀 Starting Production Server...');
  console.log('🔌 Attempting MongoDB connection...');
  
  // Initialize Mongoose first
  await initializeMongoose();
  
  // Also maintain native MongoDB connection for backward compatibility
  const mongoSuccess = await connectToMongoDBNative();
  
  if (!mongoSuccess) {
    console.log('❌ MongoDB connection failed. Production server requires MongoDB to function.');
    console.log('🔍 Troubleshooting tips:');
    console.log('- Check MONGODB_URI environment variable');
    console.log('- Verify MongoDB Atlas network access');
    console.log('- Check MongoDB Atlas credentials');
    process.exit(1);
  }
  
  // Set up database middleware
  app.use(databaseMiddleware(db, isMongoConnected));
  
  // Make db available to routes
  app.use((req, res, next) => {
    req.db = db;
    req.isMongoConnected = isMongoConnected;
    next();
  });
  
  app.listen(PORT, () => {
    console.log(`🚀 Production server running on port ${PORT}`);
    console.log(`🔗 API available at http://localhost:${PORT}/api`);
    console.log(`🔐 Authentication system enabled`);
    console.log(`💬 Messaging system enabled`);
    console.log(`🗄️ Database: MongoDB Atlas (Production Mode)`);
    console.log(`🌍 Frontend: https://day-care-app.onrender.com`);
    console.log(`✅ Production server is ready!`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (mongoClient) {
    await mongoClient.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  if (mongoClient) {
    await mongoClient.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});

startServer();

module.exports = app;










