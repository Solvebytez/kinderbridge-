const mongoose = require("mongoose");

/**
 * Contact Log Schema
 * User contact logs with daycares
 */
const contactLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    daycareId: {
      type: String,
      required: [true, "Daycare ID is required"],
      index: true,
    },
    contactMethod: {
      type: String,
      required: [true, "Contact method is required"],
      enum: {
        values: [
          "Phone Call",
          "Email",
          "In-Person Visit",
          "Video Call",
          "Text Message",
          "Other",
        ],
        message:
          "Contact method must be one of: Phone Call, Email, In-Person Visit, Video Call, Text Message, Other",
      },
      index: true,
    },
    purpose: {
      type: String,
      required: [true, "Purpose is required"],
      enum: {
        values: [
          "Initial Inquiry",
          "Follow-up",
          "Application Status",
          "Schedule Visit",
          "Question",
          "Other",
        ],
        message:
          "Purpose must be one of: Initial Inquiry, Follow-up, Application Status, Schedule Visit, Question, Other",
      },
      index: true,
    },
    notes: {
      type: String,
      required: [true, "Notes are required"],
      trim: true,
      minlength: [10, "Notes must be at least 10 characters long"],
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    outcome: {
      type: String,
      trim: true,
      default: "",
    },
    followUpDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
contactLogSchema.index({ userId: 1, createdAt: -1 });
contactLogSchema.index({ daycareId: 1, createdAt: -1 });
contactLogSchema.index({ userId: 1, daycareId: 1, createdAt: -1 });

// Static method to create contact log
contactLogSchema.statics.createContactLog = async function (contactLogData) {
  try {
    const contactLog = await this.create(contactLogData);
    return contactLog;
  } catch (error) {
    throw error;
  }
};

// Static method to get user contact logs with daycare details
contactLogSchema.statics.getUserContactLogs = async function (userId) {
  try {
    const contactLogs = await this.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Get daycare details for each contact log
    let Daycare;
    try {
      Daycare = mongoose.model("Daycare");
    } catch (error) {
      // If Daycare model is not registered, require the schema to register it
      require("./DaycareSchema");
      Daycare = mongoose.model("Daycare");
    }

    const daycareIds = contactLogs.map((log) => log.daycareId);

    const daycares = await Daycare.find({
      $or: [
        {
          _id: {
            $in: daycareIds
              .filter((id) => mongoose.Types.ObjectId.isValid(id))
              .map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
        { id: { $in: daycareIds } },
      ],
    }).lean();

    // Map contact logs with daycare data
    return contactLogs.map((log) => {
      const daycare = daycares.find(
        (d) => d._id?.toString() === log.daycareId || d.id === log.daycareId
      );

      return {
        ...log,
        daycare: daycare || null,
      };
    });
  } catch (error) {
    throw error;
  }
};

// Static method to get contact logs by daycare
contactLogSchema.statics.getDaycareContactLogs = async function (
  userId,
  daycareId
) {
  try {
    const contactLogs = await this.find({ userId, daycareId })
      .sort({ createdAt: -1 })
      .lean();
    return contactLogs;
  } catch (error) {
    throw error;
  }
};

// Static method to update contact log
contactLogSchema.statics.updateContactLog = async function (
  contactLogId,
  userId,
  updateData
) {
  try {
    const contactLog = await this.findOneAndUpdate(
      { _id: contactLogId, userId }, // Ensure user owns the contact log
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();
    return contactLog;
  } catch (error) {
    throw error;
  }
};

// Static method to delete contact log
contactLogSchema.statics.deleteContactLog = async function (
  contactLogId,
  userId
) {
  try {
    const result = await this.findOneAndDelete({
      _id: contactLogId,
      userId, // Ensure user owns the contact log
    });
    return result;
  } catch (error) {
    throw error;
  }
};

// Export model (check if already compiled to avoid recompilation errors)
let ContactLog;
try {
  ContactLog = mongoose.model("ContactLog");
} catch (error) {
  ContactLog = mongoose.model("ContactLog", contactLogSchema);
}

module.exports = ContactLog;




