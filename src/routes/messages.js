const express = require('express');
const router = express.Router();

// Send a new message
router.post('/send', async (req, res) => {
  try {
    const MessageController = require('../controllers/messageController');
    const messageController = new MessageController(req.db);
    
    const result = await messageController.sendMessage(req.body);
    res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// Get conversation between two users
router.get('/conversation/:user1Id/:user2Id', async (req, res) => {
    try {
      const { user1Id, user2Id } = req.params;
      const { limit = 50 } = req.query;
      
    const MessageController = require('../controllers/messageController');
    const messageController = new MessageController(req.db);
    
    const result = await messageController.getConversation(user1Id, user2Id, parseInt(limit));
    res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation'
    });
  }
});

// Get all conversations for a user
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType } = req.query;
    
    const MessageController = require('../controllers/messageController');
    const messageController = new MessageController(req.db);
    
    const result = await messageController.getUserConversations(userId, userType);
    res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

// Mark messages as read
router.put('/read/:conversationId/:userId', async (req, res) => {
  try {
    const { conversationId, userId } = req.params;
    
    const MessageController = require('../controllers/messageController');
    const messageController = new MessageController(req.db);
    
    const result = await messageController.markAsRead(conversationId, userId);
    res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }
});

// Get unread message count
router.get('/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const MessageController = require('../controllers/messageController');
    const messageController = new MessageController(req.db);
    
    const result = await messageController.getUnreadCount(userId);
    res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
});

// Delete a message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { senderId } = req.body;
    
    const MessageController = require('../controllers/messageController');
    const messageController = new MessageController(req.db);
    
    const result = await messageController.deleteMessage(messageId, senderId);
    res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
});

module.exports = router;
