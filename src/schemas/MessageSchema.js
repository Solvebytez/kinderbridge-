const mongoose = require('mongoose');

/**
 * Message Schema
 */
const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: [true, 'Sender ID is required'],
    index: true
  },
  recipientId: {
    type: String,
    required: [true, 'Recipient ID is required'],
    index: true
  },
  senderType: {
    type: String,
    required: [true, 'Sender type is required'],
    enum: {
      values: ['parent', 'provider', 'employer', 'employee'],
      message: 'Sender type must be one of: parent, provider, employer, employee'
    }
  },
  recipientType: {
    type: String,
    required: [true, 'Recipient type is required'],
    enum: {
      values: ['parent', 'provider', 'employer', 'employee'],
      message: 'Recipient type must be one of: parent, provider, employer, employee'
    }
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [5000, 'Message content cannot exceed 5000 characters']
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  attachments: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ recipientId: 1, read: 1 });
messageSchema.index({ senderId: 1, timestamp: -1 });

// Method to generate conversation ID
messageSchema.statics.generateConversationId = function(user1Id, user2Id) {
  const sortedIds = [user1Id, user2Id].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = async function(user1Id, user2Id, limit = 50) {
  const conversationId = this.generateConversationId(user1Id, user2Id);
  
  const messages = await this.find({ conversationId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
  
  return messages.reverse(); // Return in chronological order
};

// Static method to get user conversations
messageSchema.statics.getUserConversations = async function(userId, userType) {
  const conversations = await this.aggregate([
    {
      $match: {
        $or: [
          { senderId: userId },
          { recipientId: userId }
        ]
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$recipientId', userId] }, { $eq: ['$read', false] }] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { 'lastMessage.timestamp': -1 }
    }
  ]);

  return conversations;
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipientId: userId,
    read: false
  });
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = async function(conversationId, userId) {
  return await this.updateMany(
    {
      conversationId,
      recipientId: userId,
      read: false
    },
    {
      $set: { read: true }
    }
  );
};

// Export model (check if already compiled to avoid recompilation errors)
let Message;
try {
  Message = mongoose.model('Message');
} catch (error) {
  Message = mongoose.model('Message', messageSchema);
}

module.exports = Message;

