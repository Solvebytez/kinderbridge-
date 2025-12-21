const jwt = require('jsonwebtoken');

// JWT Secrets
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-super-secret-jwt-access-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-jwt-refresh-key-change-in-production';

/**
 * Middleware to verify JWT access token from cookie or Authorization header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
  // Try to get token from cookie first (preferred method)
  let token = req.cookies?.accessToken;
  
  // Fallback to Authorization header for backward compatibility
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      // If access token is expired, try to refresh it
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          error: 'Access token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
    
    // Check token type
    if (decoded.type && decoded.type !== 'access') {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid token type' 
      });
    }
    
    req.user = decoded;
    next();
  });
};

module.exports = {
  authenticateToken
};

