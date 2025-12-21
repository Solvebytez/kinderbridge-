const { connectToMongoDB } = require('./database');

/**
 * Initialize Mongoose connection
 * Call this at server startup
 */
let mongooseInitialized = false;

async function initializeMongoose() {
  if (mongooseInitialized) {
    return;
  }

  try {
    await connectToMongoDB();
    mongooseInitialized = true;
    console.log('✅ Mongoose initialized and connected');
  } catch (error) {
    console.error('❌ Mongoose initialization failed:', error);
    throw error;
  }
}

module.exports = {
  initializeMongoose
};


