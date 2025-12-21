const User = require("../schemas/UserSchema");
const { connectToMongoDB } = require("../config/database");

/**
 * User Model Wrapper
 * Maintains compatibility with existing code while using Mongoose
 */
class UserModel {
  constructor(db) {
    // Mongoose models are global, db parameter kept for compatibility
    this.db = db;
    this.collection = User; // Mongoose model

    // Ensure Mongoose is connected (lazy initialization)
    this.ensureConnection();
  }

  async ensureConnection() {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      try {
        await connectToMongoDB();
      } catch (error) {
        console.error("Failed to initialize Mongoose:", error);
      }
    }
  }

  /**
   * Create a new user with password hashing
   * @param {Object} userData - User registration data
   * @returns {Object} Created user (without password)
   */
  async createUser(userData) {
    try {
      await this.ensureConnection();

      const {
        email,
        password,
        firstName,
        lastName,
        userType,
        phone,
        address,
        children,
      } = userData;

      // Validate required fields
      const validationErrors = this.validateUserData(userData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      // Check if user already exists (double check for race conditions)
      // Use emailExists which checks ALL users (not just active) to prevent duplicates
      console.log(
        "🔵 [USER MODEL] Checking for existing user with email:",
        email
      );
      const emailAlreadyExists = await this.emailExists(email);
      if (emailAlreadyExists) {
        console.log("❌ [USER MODEL] User already exists with email:", email);
        throw new Error("User with this email already exists");
      }
      console.log("✅ [USER MODEL] No existing user found");

      // Extract communication preferences
      const { communicationPreferences } = userData;

      // Validate communication preferences
      if (!communicationPreferences) {
        throw new Error("Communication preferences are required");
      }

      if (communicationPreferences.email !== true) {
        throw new Error("Email consent is required");
      }

      if (communicationPreferences.acknowledgement !== true) {
        throw new Error(
          "Acknowledgement is required to proceed with registration"
        );
      }

      // Provide defaults for optional fields
      const userPayload = {
        email: email.toLowerCase(),
        password, // Will be hashed by pre-save hook
        firstName: firstName || "User", // Default if not provided
        lastName: lastName || "", // Default if not provided
        userType: userType || "parent", // Default to parent
        phone: phone || "",
        address: address || "",
        children: children || [],
        daycareId: null,
        role: null,
        communicationPreferences: {
          email: communicationPreferences.email || true,
          sms: communicationPreferences.sms || false,
          promotional: communicationPreferences.promotional || false,
          acknowledgement: communicationPreferences.acknowledgement || false,
        },
      };

      // Create user (password will be hashed by pre-save middleware)
      console.log("🔵 [USER MODEL] Attempting to create user in database...");
      const user = await User.create(userPayload);
      console.log("✅ [USER MODEL] User created in database:", {
        id: user._id,
        email: user.email,
      });

      // Return user without password (handled by schema transform)
      return user.toObject();
    } catch (error) {
      console.error("❌ [USER MODEL] Error creating user:", {
        name: error.name,
        code: error.code,
        message: error.message,
      });

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((e) => e.message);
        console.log("❌ [USER MODEL] Validation errors:", messages);
        throw new Error(messages.join(", "));
      }
      if (error.code === 11000) {
        console.log(
          "❌ [USER MODEL] Duplicate key error - email already exists"
        );
        throw new Error("User with this email already exists");
      }
      throw error;
    }
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} User object (without password)
   */
  async authenticateUser(email, password) {
    try {
      await this.ensureConnection();

      // Find user by email and include password for comparison
      const user = await User.findByEmail(email).select("+password");

      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Return user without password
      return user.toObject();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Object} User object (without password)
   */
  async getUserById(userId) {
    try {
      await this.ensureConnection();

      const user = await User.findOne({
        _id: userId,
        isActive: true,
      });

      if (!user) {
        throw new Error("User not found");
      }

      return user.toObject();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Object} User object (without password)
   */
  async getUserByEmail(email) {
    try {
      await this.ensureConnection();

      const user = await User.findByEmail(email);

      if (!user) {
        throw new Error("User not found");
      }

      return user.toObject();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated user (without password)
   */
  async updateUser(userId, updateData) {
    try {
      await this.ensureConnection();

      const { password, ...safeUpdateData } = updateData;

      // If password is being updated, it will be hashed by pre-save middleware
      const user = await User.findByIdAndUpdate(
        userId,
        { ...safeUpdateData },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error("User not found");
      }

      return user.toObject();
    } catch (error) {
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((e) => e.message);
        throw new Error(messages.join(", "));
      }
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   * @param {string} userId - User ID
   * @returns {Object} Success message
   */
  async deleteUser(userId) {
    try {
      await this.ensureConnection();

      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        throw new Error("User not found");
      }

      return { success: true, message: "User deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all users (for admin purposes)
   * @param {number} limit - Maximum number of users
   * @param {number} skip - Number of users to skip
   * @returns {Array} Array of users
   */
  async getAllUsers(limit = 50, skip = 0) {
    try {
      await this.ensureConnection();

      const users = await User.find({ isActive: true })
        .limit(limit)
        .skip(skip)
        .lean();

      return users;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search users
   * @param {string} query - Search query
   * @param {string} userType - Filter by user type
   * @param {number} limit - Maximum number of results
   * @returns {Array} Array of users
   */
  async searchUsers(query, userType = null, limit = 20) {
    try {
      await this.ensureConnection();

      let filter = { isActive: true };

      if (userType) {
        filter.userType = userType;
      }

      if (query) {
        filter.$or = [
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ];
      }

      const users = await User.find(filter).limit(limit).lean();

      return users;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get users by type
   * @param {string} userType - User type
   * @param {number} limit - Maximum number of users
   * @returns {Array} Array of users
   */
  async getUsersByType(userType, limit = 50) {
    try {
      await this.ensureConnection();

      const users = await User.find({ userType, isActive: true })
        .limit(limit)
        .lean();

      return users;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {boolean} True if email exists
   */
  async emailExists(email) {
    try {
      await this.ensureConnection();
      const normalizedEmail = email?.toLowerCase().trim();
      console.log(
        "🔵 [USER MODEL] emailExists() - Checking email:",
        normalizedEmail
      );
      const exists = await User.emailExists(normalizedEmail);
      console.log("🔵 [USER MODEL] emailExists() - Result:", exists);
      return exists;
    } catch (error) {
      console.error("❌ [USER MODEL] Error checking email:", error);
      throw error;
    }
  }

  /**
   * Validate user data
   * @param {Object} userData - User data to validate
   * @returns {Array} Array of validation errors
   */
  validateUserData(userData) {
    const errors = [];

    // Basic validation (express-validator handles most validation, but this is a safety net)
    if (!userData.email || !userData.email.includes("@")) {
      errors.push("Valid email is required");
    }

    if (!userData.password || userData.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    // Phone is optional - no validation needed

    if (!userData.address || userData.address.trim().length === 0) {
      errors.push("Postal address or code is required");
    }

    // Validate children - only check age for simplified registration
    if (userData.userType === "parent" || !userData.userType) {
      if (
        !userData.children ||
        !Array.isArray(userData.children) ||
        userData.children.length === 0
      ) {
        errors.push("At least one child is required");
      } else {
        const hasValidChildren = userData.children.some(
          (child) => child.age > 0 && child.age <= 18
        );
        if (!hasValidChildren) {
          errors.push("At least one child must have a valid age (1-18)");
        }
      }
    }

    return errors;
  }
}

module.exports = UserModel;
