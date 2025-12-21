/**
 * Cookie Helper Utilities
 * Provides functions to set and clear httpOnly cookies for authentication
 */

/**
 * Parse expiry string (e.g., "15m", "30d") to milliseconds
 * @param {string} expiry - Expiry string from environment variable
 * @returns {number} Milliseconds
 */
const parseExpiryToMs = (expiry) => {
  if (!expiry) return 15 * 60 * 1000; // Default 15 minutes
  
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // Default 15 minutes
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000; // seconds
    case 'm': return value * 60 * 1000; // minutes
    case 'h': return value * 60 * 60 * 1000; // hours
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    default: return 15 * 60 * 1000; // Default 15 minutes
  }
};

/**
 * Set access token cookie
 * @param {Object} res - Express response object
 * @param {string} token - Access token
 */
const setAccessTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  const maxAge = parseExpiryToMs(expiresIn);
  
  console.log('🍪 [COOKIE_HELPER] Setting access token cookie:', {
    isProduction,
    expiresIn,
    maxAge,
    maxAgeMinutes: Math.round(maxAge / 60000),
    tokenLength: token.length
  });
  
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // Only send over HTTPS in production
    sameSite: isProduction ? 'none' : 'lax', // Support cross-origin in production
    maxAge: maxAge,
    path: '/',
  };
  
  console.log('🍪 [COOKIE_HELPER] Cookie options:', cookieOptions);
  
  res.cookie('accessToken', token, cookieOptions);
  
  console.log('✅ [COOKIE_HELPER] Access token cookie set successfully');
};

/**
 * Set refresh token cookie
 * @param {Object} res - Express response object
 * @param {string} token - Refresh token
 */
const setRefreshTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  const maxAge = parseExpiryToMs(expiresIn);
  
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction, // Only send over HTTPS in production
    sameSite: isProduction ? 'none' : 'lax', // Support cross-origin in production
    maxAge: maxAge,
    path: '/',
  });
};

/**
 * Clear authentication cookies
 * @param {Object} res - Express response object
 */
const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
  
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
};

module.exports = {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
};

