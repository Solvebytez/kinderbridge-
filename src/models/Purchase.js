const Purchase = require('../schemas/PurchaseSchema');

/**
 * Purchase Model Wrapper
 * Maintains compatibility with existing code while using Mongoose
 */
class PurchaseModel {
  constructor(db) {
    this.db = db;
    this.collection = Purchase; // Mongoose model
  }

  /**
   * Create a new purchase
   * @param {Object} purchaseData - Purchase data
   * @returns {Object} Created purchase
   */
  async createPurchase(purchaseData) {
    try {
      const validationErrors = this.validatePurchaseData(purchaseData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const purchase = await Purchase.create(purchaseData);
      return purchase.toObject();
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        throw new Error(messages.join(', '));
      }
      throw error;
    }
  }

  /**
   * Get purchase by ID
   * @param {string} purchaseId - Purchase ID
   * @returns {Object} Purchase object
   */
  async getPurchaseById(purchaseId) {
    try {
      const purchase = await Purchase.findById(purchaseId);
      
      if (!purchase) {
        throw new Error('Purchase not found');
      }

      return purchase.toObject();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user purchases
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, skip, status)
   * @returns {Array} Array of purchases
   */
  async getUserPurchases(userId, options = {}) {
    try {
      return await Purchase.getUserPurchases(userId, options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get daycare purchases
   * @param {string} daycareId - Daycare ID
   * @param {Object} options - Query options
   * @returns {Array} Array of purchases
   */
  async getDaycarePurchases(daycareId, options = {}) {
    try {
      return await Purchase.getDaycarePurchases(daycareId, options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update purchase status
   * @param {string} purchaseId - Purchase ID
   * @param {string} status - New status
   * @param {Object} updateData - Additional update data
   * @returns {Object} Updated purchase
   */
  async updatePurchaseStatus(purchaseId, status, updateData = {}) {
    try {
      const purchase = await Purchase.findByIdAndUpdate(
        purchaseId,
        { status, ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!purchase) {
        throw new Error('Purchase not found');
      }

      return purchase.toObject();
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        throw new Error(messages.join(', '));
      }
      throw error;
    }
  }

  /**
   * Get purchase statistics
   * @param {string} userId - Optional user ID for user-specific stats
   * @param {string} daycareId - Optional daycare ID for daycare-specific stats
   * @returns {Object} Statistics object
   */
  async getStats(userId = null, daycareId = null) {
    try {
      return await Purchase.getStats(userId, daycareId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete purchase (soft delete by updating status)
   * @param {string} purchaseId - Purchase ID
   * @returns {boolean} Success status
   */
  async deletePurchase(purchaseId) {
    try {
      const purchase = await Purchase.findByIdAndUpdate(
        purchaseId,
        { status: 'cancelled', updatedAt: new Date() },
        { new: true }
      );

      return !!purchase;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate purchase data
   * @param {Object} purchaseData - Purchase data to validate
   * @returns {Array} Array of validation errors
   */
  validatePurchaseData(purchaseData) {
    const errors = [];

    if (!purchaseData.userId) {
      errors.push('User ID is required');
    }

    if (!purchaseData.amount || isNaN(purchaseData.amount) || purchaseData.amount <= 0) {
      errors.push('Valid amount is required');
    }

    if (purchaseData.status && !['pending', 'completed', 'failed', 'refunded', 'cancelled'].includes(purchaseData.status)) {
      errors.push('Invalid status. Must be: pending, completed, failed, refunded, or cancelled');
    }

    return errors;
  }
}

module.exports = PurchaseModel;
