const {
  successResponse,
  errorResponse,
  notFoundResponse,
  internalErrorResponse,
  unauthorizedResponse,
} = require("../utils/responseHelper");

/**
 * Contact Log Controller
 * Handles all contact log business logic
 */
class ContactLogController {
  constructor(db) {
    this.db = db;
    // Ensure Mongoose is connected (models will handle initialization)
    const ContactLog = require("../models/ContactLog");
    this.contactLogModel = new ContactLog(db);
  }

  /**
   * Create a new contact log
   * @param {string} userId - User ID
   * @param {Object} contactLogData - Contact log data
   * @returns {Object} Response with created contact log
   */
  async createContactLog(userId, contactLogData) {
    try {
      if (!userId) {
        return unauthorizedResponse("User ID is required");
      }

      if (!contactLogData.daycareId) {
        return errorResponse("Daycare ID is required", 400);
      }

      if (!contactLogData.contactMethod) {
        return errorResponse("Contact method is required", 400);
      }

      if (!contactLogData.purpose) {
        return errorResponse("Purpose is required", 400);
      }

      if (!contactLogData.notes || contactLogData.notes.length < 10) {
        return errorResponse(
          "Notes are required and must be at least 10 characters",
          400
        );
      }

      // Add userId to contact log data
      const fullContactLogData = {
        ...contactLogData,
        userId,
      };

      const contactLog = await this.contactLogModel.createContactLog(
        fullContactLogData
      );

      const response = successResponse(contactLog);
      response.body.message = "Contact log created successfully";
      return response;
    } catch (error) {
      console.error("Error creating contact log:", error);
      if (error.name === "ValidationError") {
        return errorResponse(error.message, 400);
      }
      return internalErrorResponse(error.message);
    }
  }

  /**
   * Get user's contact logs
   * @param {string} userId - User ID
   * @returns {Object} Response with user's contact logs
   */
  async getUserContactLogs(userId) {
    try {
      if (!userId) {
        return unauthorizedResponse("User ID is required");
      }

      const contactLogs = await this.contactLogModel.getUserContactLogs(userId);

      const response = successResponse(contactLogs);
      response.body.metadata = {
        totalCount: contactLogs.length,
        timestamp: new Date().toISOString(),
      };
      return response;
    } catch (error) {
      console.error("Error fetching contact logs:", error);
      return internalErrorResponse(error.message);
    }
  }

  /**
   * Get contact logs by daycare
   * @param {string} userId - User ID
   * @param {string} daycareId - Daycare ID
   * @returns {Object} Response with contact logs for the daycare
   */
  async getDaycareContactLogs(userId, daycareId) {
    try {
      if (!userId) {
        return unauthorizedResponse("User ID is required");
      }

      if (!daycareId) {
        return errorResponse("Daycare ID is required", 400);
      }

      const contactLogs = await this.contactLogModel.getDaycareContactLogs(
        userId,
        daycareId
      );

      const response = successResponse(contactLogs);
      response.body.metadata = {
        totalCount: contactLogs.length,
        timestamp: new Date().toISOString(),
      };
      return response;
    } catch (error) {
      console.error("Error fetching daycare contact logs:", error);
      return internalErrorResponse(error.message);
    }
  }

  /**
   * Update a contact log
   * @param {string} userId - User ID
   * @param {string} contactLogId - Contact log ID
   * @param {Object} updateData - Update data
   * @returns {Object} Response with updated contact log
   */
  async updateContactLog(userId, contactLogId, updateData) {
    try {
      if (!userId) {
        return unauthorizedResponse("User ID is required");
      }

      if (!contactLogId) {
        return errorResponse("Contact log ID is required", 400);
      }

      // Validate update data
      if (updateData.notes && updateData.notes.length < 10) {
        return errorResponse(
          "Notes must be at least 10 characters long",
          400
        );
      }

      const contactLog = await this.contactLogModel.updateContactLog(
        contactLogId,
        userId,
        updateData
      );

      if (!contactLog) {
        return notFoundResponse("Contact log not found or you don't have permission to update it");
      }

      const response = successResponse(contactLog);
      response.body.message = "Contact log updated successfully";
      return response;
    } catch (error) {
      console.error("Error updating contact log:", error);
      if (error.name === "ValidationError") {
        return errorResponse(error.message, 400);
      }
      return internalErrorResponse(error.message);
    }
  }

  /**
   * Delete a contact log
   * @param {string} userId - User ID
   * @param {string} contactLogId - Contact log ID
   * @returns {Object} Response with deletion confirmation
   */
  async deleteContactLog(userId, contactLogId) {
    try {
      if (!userId) {
        return unauthorizedResponse("User ID is required");
      }

      if (!contactLogId) {
        return errorResponse("Contact log ID is required", 400);
      }

      const contactLog = await this.contactLogModel.deleteContactLog(
        contactLogId,
        userId
      );

      if (!contactLog) {
        return notFoundResponse("Contact log not found or you don't have permission to delete it");
      }

      const response = successResponse({ deleted: true, id: contactLogId });
      response.body.message = "Contact log deleted successfully";
      return response;
    } catch (error) {
      console.error("Error deleting contact log:", error);
      return internalErrorResponse(error.message);
    }
  }
}

module.exports = ContactLogController;




