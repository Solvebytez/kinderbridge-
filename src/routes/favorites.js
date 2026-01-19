const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

// GET /api/favorites - Get user's favorites
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const FavoriteController = require("../controllers/favoriteController");
    const favoriteController = new FavoriteController(req.db);

    const result = await favoriteController.getUserFavorites(userId);
    res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/favorites - Add daycare to favorites
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { daycareId } = req.body;

    if (!daycareId) {
      return res.status(400).json({
        success: false,
        error: "Daycare ID is required",
      });
    }

    const FavoriteController = require("../controllers/favoriteController");
    const favoriteController = new FavoriteController(req.db);

    const result = await favoriteController.addFavorite(userId, daycareId);
    res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// DELETE /api/favorites/:daycareId - Remove daycare from favorites
router.delete("/:daycareId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { daycareId } = req.params;

    const FavoriteController = require("../controllers/favoriteController");
    const favoriteController = new FavoriteController(req.db);

    const result = await favoriteController.removeFavorite(userId, daycareId);
    res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/favorites/check/:daycareId - Check if daycare is favorited
router.get("/check/:daycareId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { daycareId } = req.params;

    const FavoriteController = require("../controllers/favoriteController");
    const favoriteController = new FavoriteController(req.db);

    const result = await favoriteController.isFavorited(userId, daycareId);
    res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/favorites/count/:daycareId - Get favorite count for a daycare
router.get("/count/:daycareId", async (req, res) => {
  try {
    const { daycareId } = req.params;

    const FavoriteController = require("../controllers/favoriteController");
    const favoriteController = new FavoriteController(req.db);

    const result = await favoriteController.getDaycareFavoriteCount(daycareId);
    res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error("Error fetching favorite count:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
