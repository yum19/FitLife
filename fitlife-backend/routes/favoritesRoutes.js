// routes/favoritesRoutes.js
const express = require('express');
const router = express.Router();
const {
  getUserFavorites,
  ajouterFavori,
  supprimerFavori,
  checkFavoriteStatus,
  toggleFavorite
} = require('../controllers/favoritesController');
const { auth } = require('../middleware/auth'); // Destructure auth from the exported object
const Favorite = require('../models/Favorite'); // Add Favorite model import

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/favorites/:userId
// @desc    Get all favorites for a specific user
// @access  Private
router.get('/:userId', getUserFavorites);

// @route   POST /api/favorites
// @desc    Add item to favorites
// @access  Private
router.post('/', ajouterFavori);

// @route   DELETE /api/favorites
// @desc    Remove item from favorites
// @access  Private
router.delete('/', supprimerFavori);

// @route   GET /api/favorites/check/:userId/:favoriId
// @desc    Check if item is favorited by user
// @access  Private
router.get('/check/:userId/:favoriId', checkFavoriteStatus);

// @route   PUT /api/favorites/toggle
// @desc    Toggle favorite status
// @access  Private
router.put('/toggle', toggleFavorite);

// @route   DELETE /api/favorites/:userId/:favoriId
// @desc    Remove specific favorite
// @access  Private
router.delete('/:userId/:favoriId', async (req, res) => {
  try {
    const { userId, favoriId } = req.params;
    const result = await Favorite.supprimerFavoriStatic(userId, parseInt(favoriId));

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item removed from favorites successfully'
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing favorite'
    });
  }
});

module.exports = router;