/**
 * Database middleware
 * Attaches database connection to request object
 * @param {Object} db - MongoDB database instance
 * @param {boolean} isMongoConnected - Connection status
 * @returns {Function} Express middleware function
 */
const databaseMiddleware = (db, isMongoConnected) => {
  return (req, res, next) => {
    if (!isMongoConnected) {
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable',
        message: 'MongoDB connection is not established. Please check server logs.'
      });
    }
    req.db = db;
    next();
  };
};

module.exports = {
  databaseMiddleware
};

