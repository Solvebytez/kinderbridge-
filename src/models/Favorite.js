const Favorite = require('../schemas/FavoriteSchema');

/**
 * Favorite Model Wrapper
 * Maintains compatibility with existing code while using Mongoose
 */
class FavoriteModel {
  constructor(db) {
    this.db = db;
    this.collection = Favorite; // Mongoose model
  }

  /**
   * Add daycare to favorites
   * @param {string} userId - User ID
   * @param {string} daycareId - Daycare ID
   * @returns {Object} Created favorite
   */
  async addFavorite(userId, daycareId) {
    try {
      return await Favorite.addFavorite(userId, daycareId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove daycare from favorites
   * @param {string} userId - User ID
   * @param {string} daycareId - Daycare ID
   * @returns {boolean} Success status
   */
  async removeFavorite(userId, daycareId) {
    try {
      return await Favorite.removeFavorite(userId, daycareId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's favorites
   * @param {string} userId - User ID
   * @returns {Array} Array of favorite daycares
   */
  async getUserFavorites(userId) {
    try {
      return await Favorite.getUserFavorites(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if daycare is favorited by user
   * @param {string} userId - User ID
   * @param {string} daycareId - Daycare ID
   * @returns {boolean} Is favorited
   */
  async isFavorited(userId, daycareId) {
    try {
      return await Favorite.isFavorited(userId, daycareId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get favorite count for a daycare
   * @param {string} daycareId - Daycare ID
   * @returns {number} Favorite count
   */
  async getDaycareFavoriteCount(daycareId) {
    try {
      return await Favorite.getDaycareFavoriteCount(daycareId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove all favorites for a user
   * @param {string} userId - User ID
   * @returns {number} Number of favorites removed
   */
  async removeAllUserFavorites(userId) {
    try {
      const result = await Favorite.deleteMany({ userId });
      return result.deletedCount;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = FavoriteModel;
