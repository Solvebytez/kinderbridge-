const mongoose = require('mongoose');

/**
 * Session Schema
 * User sessions and JWT tokens
 */
const sessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    },
    index: { expireAfterSeconds: 0 } // TTL index for automatic deletion
  }
}, {
  timestamps: true
});

// Index for user session lookup
sessionSchema.index({ userId: 1, createdAt: -1 });

// Static method to create session
sessionSchema.statics.createSession = async function(userId, token) {
  // Remove existing session for user (single session per user)
  await this.deleteMany({ userId });
  
  const session = await this.create({
    userId,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  
  return session;
};

// Static method to get session by token
sessionSchema.statics.getSessionByToken = async function(token) {
  const session = await this.findOne({ token });
  
  if (!session) {
    return null;
  }
  
  // Check if expired
  if (session.expiresAt && new Date() > session.expiresAt) {
    await this.deleteOne({ _id: session._id });
    return null;
  }
  
  return session;
};

// Static method to get session by user ID
sessionSchema.statics.getSessionByUserId = async function(userId) {
  const session = await this.findOne({ userId });
  
  if (!session) {
    return null;
  }
  
  // Check if expired
  if (session.expiresAt && new Date() > session.expiresAt) {
    await this.deleteOne({ _id: session._id });
    return null;
  }
  
  return session;
};

// Static method to delete session
sessionSchema.statics.deleteSession = async function(token) {
  const result = await this.deleteOne({ token });
  return result.deletedCount > 0;
};

// Static method to delete session by user ID
sessionSchema.statics.deleteSessionByUserId = async function(userId) {
  const result = await this.deleteMany({ userId });
  return result.deletedCount > 0;
};

// Static method to delete expired sessions
sessionSchema.statics.deleteExpiredSessions = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  return result.deletedCount;
};

// Export model (check if already compiled to avoid recompilation errors)
let Session;
try {
  Session = mongoose.model('Session');
} catch (error) {
  Session = mongoose.model('Session', sessionSchema);
}

module.exports = Session;

