const mongoose = require("mongoose");

/**
 * Favorite Schema
 * User favorite daycares
 */
const favoriteSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate favorites
favoriteSchema.index({ userId: 1, daycareId: 1 }, { unique: true });

// Index for user favorites lookup
favoriteSchema.index({ userId: 1, createdAt: -1 });

// Index for daycare popularity
favoriteSchema.index({ daycareId: 1 });

// Static method to add favorite
favoriteSchema.statics.addFavorite = async function (userId, daycareId) {
  try {
    const favorite = await this.create({ userId, daycareId });
    return favorite;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("Daycare is already in favorites");
    }
    throw error;
  }
};

// Static method to remove favorite
favoriteSchema.statics.removeFavorite = async function (userId, daycareId) {
  const result = await this.deleteOne({ userId, daycareId });
  return result.deletedCount > 0;
};

// Static method to check if favorited
favoriteSchema.statics.isFavorited = async function (userId, daycareId) {
  const favorite = await this.findOne({ userId, daycareId });
  return !!favorite;
};

// Static method to get user favorites
favoriteSchema.statics.getUserFavorites = async function (userId) {
  const favorites = await this.find({ userId }).sort({ createdAt: -1 }).lean();

  // Get daycare details - lazy load Daycare schema to avoid registration issues
  let Daycare;
  try {
    Daycare = mongoose.model("Daycare");
  } catch (error) {
    // If Daycare model is not registered, require the schema to register it
    require("./DaycareSchema");
    Daycare = mongoose.model("Daycare");
  }

  const daycareIds = favorites.map((f) => f.daycareId);

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

  // Map favorites with daycare data
  return favorites.map((fav) => {
    const daycare = daycares.find(
      (d) => d._id.toString() === fav.daycareId || d.id === fav.daycareId
    );
    return {
      ...fav,
      daycare,
    };
  });
};

// Static method to get favorite count for daycare
favoriteSchema.statics.getDaycareFavoriteCount = async function (daycareId) {
  return await this.countDocuments({ daycareId });
};

// Export model (check if already compiled to avoid recompilation errors)
let Favorite;
try {
  Favorite = mongoose.model("Favorite");
} catch (error) {
  Favorite = mongoose.model("Favorite", favoriteSchema);
}

module.exports = Favorite;
