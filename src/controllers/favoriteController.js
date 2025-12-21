const {
  successResponse,
  errorResponse,
  notFoundResponse,
  internalErrorResponse,
  unauthorizedResponse,
} = require("../utils/responseHelper");

/**
 * Favorite Controller
 * Handles all favorite business logic
 */
class FavoriteController {
  constructor(db) {
    this.db = db;
    // Ensure Mongoose is connected (models will handle initialization)
    const Favorite = require("../models/Favorite");
    this.favoriteModel = new Favorite(db);
  }

  /**
   * Get user's favorites
   * @param {string} userId - User ID
   * @returns {Object} Response with user's favorite daycares
   */
  async getUserFavorites(userId) {
    try {
      if (!userId) {
        return unauthorizedResponse("User ID is required");
      }

      const favorites = await this.favoriteModel.getUserFavorites(userId);

      const response = successResponse(favorites);
      response.body.metadata = {
        totalCount: favorites.length,
        timestamp: new Date().toISOString(),
      };
      return response;
    } catch (error) {
      console.error("Error fetching user favorites:", error);
      return internalErrorResponse(error.message);
    }
  }

  /**
   * Add daycare to favorites
   * @param {string} userId - User ID
   * @param {string} daycareId - Daycare ID
   * @returns {Object} Response with created favorite
   */
  async addFavorite(userId, daycareId) {
    try {
      if (!userId) {
        return unauthorizedResponse("User ID is required");
      }

      if (!daycareId) {
        return errorResponse("Daycare ID is required", 400);
      }

      const favorite = await this.favoriteModel.addFavorite(userId, daycareId);

      const response = successResponse(favorite);
      response.body.message = "Daycare added to favorites successfully";
      return response;
    } catch (error) {
      console.error("Error adding favorite:", error);
      if (error.message === "Daycare is already in favorites") {
        return errorResponse(error.message, 409);
      }
      return internalErrorResponse(error.message);
    }
  }

  /**
   * Remove daycare from favorites
   * @param {string} userId - User ID
   * @param {string} daycareId - Daycare ID
   * @returns {Object} Response with success status
   */
  async removeFavorite(userId, daycareId) {
    try {
      if (!userId) {
        return unauthorizedResponse("User ID is required");
      }

      if (!daycareId) {
        return errorResponse("Daycare ID is required", 400);
      }

      const removed = await this.favoriteModel.removeFavorite(
        userId,
        daycareId
      );

      if (!removed) {
        return notFoundResponse("Favorite not found");
      }

      return successResponse({
        removed: true,
        message: "Daycare removed from favorites successfully",
      });
    } catch (error) {
      console.error("Error removing favorite:", error);
      return internalErrorResponse(error.message);
    }
  }

  /**
   * Check if daycare is favorited by user
   * @param {string} userId - User ID
   * @param {string} daycareId - Daycare ID
   * @returns {Object} Response with favorited status
   */
  async isFavorited(userId, daycareId) {
    try {
      if (!userId) {
        return unauthorizedResponse("User ID is required");
      }

      if (!daycareId) {
        return errorResponse("Daycare ID is required", 400);
      }

      const isFavorited = await this.favoriteModel.isFavorited(
        userId,
        daycareId
      );

      return successResponse({ isFavorited });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      return internalErrorResponse(error.message);
    }
  }

  /**
   * Get favorite count for a daycare
   * @param {string} daycareId - Daycare ID
   * @returns {Object} Response with favorite count
   */
  async getDaycareFavoriteCount(daycareId) {
    try {
      if (!daycareId) {
        return errorResponse("Daycare ID is required", 400);
      }

      const count = await this.favoriteModel.getDaycareFavoriteCount(daycareId);

      return successResponse({ count });
    } catch (error) {
      console.error("Error fetching favorite count:", error);
      return internalErrorResponse(error.message);
    }
  }
}

module.exports = FavoriteController;
