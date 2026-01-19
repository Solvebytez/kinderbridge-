const Message = require('../schemas/MessageSchema');
const { connectToMongoDB } = require('../config/database');

/**
 * Message Model Wrapper
 * Maintains compatibility with existing code while using Mongoose
 */
class MessageModel {
  constructor(db) {
    // Mongoose models are global, db parameter kept for compatibility
    this.db = db;
    this.collection = Message; // Mongoose model
    
    // Ensure Mongoose is connected (lazy initialization)
    this.ensureConnection();
  }

  async ensureConnection() {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      try {
        await connectToMongoDB();
      } catch (error) {
        console.error('Failed to initialize Mongoose:', error);
      }
    }
  }

  /**
   * Create a new message
   * @param {Object} messageData - Message data
   * @returns {Object} Created message
   */
  async create(messageData) {
    try {
      await this.ensureConnection();
      
      const {
        senderId,
        recipientId,
        senderType,
        recipientType,
        content,
        attachments
      } = messageData;

      // Generate conversation ID if not provided
      const conversationId = messageData.conversationId || 
        Message.generateConversationId(senderId, recipientId);

      const message = await Message.create({
        senderId,
        recipientId,
        senderType,
        recipientType,
        content,
        conversationId,
        attachments: attachments || []
      });

      return message.toObject();
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        throw new Error(messages.join(', '));
      }
      throw error;
    }
  }

  /**
   * Get conversation between two users
   * @param {string} user1Id - First user ID
   * @param {string} user2Id - Second user ID
   * @param {number} limit - Maximum number of messages
   * @returns {Array} Array of messages
   */
  async getConversation(user1Id, user2Id, limit = 50) {
    try {
      await this.ensureConnection();
      
      return await Message.getConversation(user1Id, user2Id, limit);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   * @param {string} userId - User ID
   * @param {string} userType - User type
   * @returns {Array} Array of conversations
   */
  async getUserConversations(userId, userType) {
    try {
      await this.ensureConnection();
      
      return await Message.getUserConversations(userId, userType);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark messages as read
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @returns {void}
   */
  async markAsRead(conversationId, userId) {
    try {
      await this.ensureConnection();
      
      await Message.markAsRead(conversationId, userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get unread message count for a user
   * @param {string} userId - User ID
   * @returns {number} Unread count
   */
  async getUnreadCount(userId) {
    try {
      await this.ensureConnection();
      
      return await Message.getUnreadCount(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate conversation ID (consistent between two users)
   * @param {string} user1Id - First user ID
   * @param {string} user2Id - Second user ID
   * @returns {string} Conversation ID
   */
  generateConversationId(user1Id, user2Id) {
    return Message.generateConversationId(user1Id, user2Id);
  }

  /**
   * Delete a message (only by sender)
   * @param {string} messageId - Message ID
   * @param {string} senderId - Sender ID
   * @returns {boolean} Success status
   */
  async deleteMessage(messageId, senderId) {
    try {
      await this.ensureConnection();
      
      const result = await Message.deleteOne({
        _id: messageId,
        senderId: senderId
      });
      return result.deletedCount > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MessageModel;
