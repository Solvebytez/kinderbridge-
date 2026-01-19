const Session = require('../schemas/SessionSchema');

/**
 * Session Model Wrapper
 * Maintains compatibility with existing code while using Mongoose
 */
class SessionModel {
  constructor(db) {
    this.db = db;
    this.collection = Session; // Mongoose model
  }

  /**
   * Create a new session
   * @param {string} userId - User ID
   * @param {string} token - JWT token
   * @returns {Object} Created session
   */
  async createSession(userId, token) {
    try {
      return await Session.createSession(userId, token);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get session by token
   * @param {string} token - JWT token
   * @returns {Object} Session object
   */
  async getSessionByToken(token) {
    try {
      return await Session.getSessionByToken(token);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get session by user ID
   * @param {string} userId - User ID
   * @returns {Object} Session object
   */
  async getSessionByUserId(userId) {
    try {
      return await Session.getSessionByUserId(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete session by token
   * @param {string} token - JWT token
   * @returns {boolean} Success status
   */
  async deleteSession(token) {
    try {
      return await Session.deleteSession(token);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete session by user ID
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async deleteSessionByUserId(userId) {
    try {
      return await Session.deleteSessionByUserId(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete all expired sessions
   * @returns {number} Number of sessions deleted
   */
  async deleteExpiredSessions() {
    try {
      return await Session.deleteExpiredSessions();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update session expiration
   * @param {string} token - JWT token
   * @param {Date} expiresAt - New expiration date
   * @returns {Object} Updated session
   */
  async updateSessionExpiration(token, expiresAt) {
    try {
      return await Session.updateSessionExpiration(token, expiresAt);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all active sessions for a user
   * @param {string} userId - User ID
   * @returns {Array} Array of sessions
   */
  async getUserSessions(userId) {
    try {
      const sessions = await Session.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      // Filter out expired sessions
      const now = new Date();
      return sessions.filter(session => 
        !session.expiresAt || session.expiresAt > now
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SessionModel;
