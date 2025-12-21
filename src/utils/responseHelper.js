/**
 * Response Helper Utilities
 * Provides consistent response formatting across all controllers
 */

/**
 * Success response
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Formatted success response
 */
const successResponse = (data, message = null, statusCode = 200) => {
  const response = {
    success: true,
    data: data
  };

  if (message) {
    response.message = message;
  }

  return {
    statusCode,
    body: response
  };
};

/**
 * Error response
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Array} details - Optional error details array
 * @returns {Object} Formatted error response
 */
const errorResponse = (error, statusCode = 400, details = null) => {
  const response = {
    success: false,
    error: error
  };

  if (details) {
    response.details = details;
  }

  return {
    statusCode,
    body: response
  };
};

/**
 * Not found response
 * @param {string} message - Error message
 * @returns {Object} Formatted 404 response
 */
const notFoundResponse = (message = 'Resource not found') => {
  return errorResponse(message, 404);
};

/**
 * Unauthorized response
 * @param {string} message - Error message
 * @returns {Object} Formatted 401 response
 */
const unauthorizedResponse = (message = 'Unauthorized access') => {
  return errorResponse(message, 401);
};

/**
 * Forbidden response
 * @param {string} message - Error message
 * @returns {Object} Formatted 403 response
 */
const forbiddenResponse = (message = 'Access denied') => {
  return errorResponse(message, 403);
};

/**
 * Internal server error response
 * @param {string} message - Error message
 * @returns {Object} Formatted 500 response
 */
const internalErrorResponse = (message = 'Internal server error') => {
  return errorResponse(message, 500);
};

module.exports = {
  successResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse
};


