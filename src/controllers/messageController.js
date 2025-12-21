const { successResponse, errorResponse, notFoundResponse, internalErrorResponse } = require('../utils/responseHelper');

/**
 * Message Controller
 * Handles all messaging business logic
 */
class MessageController {
  constructor(db) {
    this.db = db;
    // Ensure Mongoose is connected (models will handle initialization)
    const Message = require('../models/Message');
    this.messageModel = new Message(db);
  }

  /**
   * Send a new message
   * @param {Object} messageData - Message data (senderId, recipientId, senderType, recipientType, content, attachments)
   * @returns {Object} Response with created message
   */
  async sendMessage(messageData) {
    try {
      const { senderId, recipientId, senderType, recipientType, content, attachments } = messageData;

      if (!senderId || !recipientId || !content) {
        return errorResponse('Missing required fields', 400);
      }

      const message = await this.messageModel.create({
        senderId,
        recipientId,
        senderType,
        recipientType,
        content,
        attachments: attachments || []
      });

      return successResponse(message);
    } catch (error) {
      console.error('Error sending message:', error);
      return internalErrorResponse('Failed to send message');
    }
  }

  /**
   * Get conversation between two users
   * @param {string} user1Id - First user ID
   * @param {string} user2Id - Second user ID
   * @param {number} limit - Maximum number of messages to return
   * @returns {Object} Response with conversation messages
   */
  async getConversation(user1Id, user2Id, limit = 50) {
    try {
      const messages = await this.messageModel.getConversation(user1Id, user2Id, parseInt(limit));
      return successResponse(messages);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return internalErrorResponse('Failed to fetch conversation');
    }
  }

  /**
   * Get all conversations for a user
   * @param {string} userId - User ID
   * @param {string} userType - User type
   * @returns {Object} Response with user conversations
   */
  async getUserConversations(userId, userType) {
    try {
      const conversations = await this.messageModel.getUserConversations(userId, userType);
      return successResponse(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return internalErrorResponse('Failed to fetch conversations');
    }
  }

  /**
   * Mark messages as read
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @returns {Object} Success response
   */
  async markAsRead(conversationId, userId) {
    try {
      await this.messageModel.markAsRead(conversationId, userId);
      return successResponse(null, 'Messages marked as read');
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return internalErrorResponse('Failed to mark messages as read');
    }
  }

  /**
   * Get unread message count for a user
   * @param {string} userId - User ID
   * @returns {Object} Response with unread count
   */
  async getUnreadCount(userId) {
    try {
      const count = await this.messageModel.getUnreadCount(userId);
      return successResponse({ unreadCount: count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return internalErrorResponse('Failed to get unread count');
    }
  }

  /**
   * Delete a message
   * @param {string} messageId - Message ID
   * @param {string} senderId - Sender ID (for authorization)
   * @returns {Object} Success response
   */
  async deleteMessage(messageId, senderId) {
    try {
      if (!senderId) {
        return errorResponse('Sender ID required', 400);
      }

      const deleted = await this.messageModel.deleteMessage(messageId, senderId);

      if (deleted) {
        return successResponse(null, 'Message deleted');
      } else {
        return notFoundResponse('Message not found or unauthorized');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      return internalErrorResponse('Failed to delete message');
    }
  }
}

module.exports = MessageController;

