// controllers/favoritesController.js
const Favorite = require('../models/Favorite');
const Produit = require('../models/Produit');
const mongoose = require('mongoose');

exports.getUserFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching favorites for user:', userId);
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Fetch favorites
    const favorites = await Favorite.find({ userId }).lean();
    console.log('Found favorites:', favorites?.length || 0);
    
    if (!favorites || favorites.length === 0) {
      return res.status(200).json({
        success: true,
        favorites: [],
        products: []
      });
    }
    
    // Get favorite IDs (strings)
    const favoriteIds = favorites.map(fav => fav.favoriId).filter(id => id);
    console.log('Favorite IDs:', favoriteIds);
    
    if (favoriteIds.length === 0) {
      return res.status(200).json({
        success: true,
        favorites: [],
        products: []
      });
    }
    
    // Validate favorite IDs
    const invalidIds = favoriteIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      console.warn('Invalid product IDs found:', invalidIds);
    }
    
    // Fetch product details using favoriteIds (strings)
    const products = await Produit.find({ _id: { $in: favoriteIds } }).lean();
    console.log('Found products:', products.length);
    
    // Debug: Log sample product
    if (products.length > 0) {
      console.log('Sample product:', {
        _id: products[0]._id,
        nom: products[0].nom,
        prix: products[0].prix
      });
    }
    
    res.status(200).json({
      success: true,
      favorites: favoriteIds,
      products: products
    });
    
  } catch (error) {
    console.error('Error fetching favorites:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching favorites',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.ajouterFavori = async (req, res) => {
  try {
    const { userId, favoriId } = req.body;
    console.log('Adding favorite:', { userId, favoriId });
    
    if (!userId || !favoriId) {
      return res.status(400).json({
        success: false,
        message: 'userId and favoriId are required'
      });
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(favoriId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ userId, favoriId });
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Item is already in favorites'
      });
    }

    // Add favorite
    await Favorite.create({ userId, favoriId });
    console.log('Added favorite');
    
    res.status(201).json({
      success: true,
      message: 'Item added to favorites successfully'
    });
    
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding favorite',
      error: error.message
    });
  }
};

exports.supprimerFavori = async (req, res) => {
  try {
    const { userId, favoriId } = req.body;
    console.log('Removing favorite:', { userId, favoriId });
    
    if (!userId || !favoriId) {
      return res.status(400).json({
        success: false,
        message: 'userId and favoriId are required'
      });
    }
    
    const result = await Favorite.deleteOne({ userId, favoriId });
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    console.log('Removed favorite');
    res.status(200).json({
      success: true,
      message: 'Item removed from favorites successfully'
    });
    
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing favorite',
      error: error.message
    });
  }
};

exports.checkFavoriteStatus = async (req, res) => {
  try {
    const { userId, favoriId } = req.params;
    console.log('Checking favorite status:', { userId, favoriId });
    
    const favorite = await Favorite.findOne({ userId, favoriId });
    res.status(200).json({
      success: true,
      isFavorited: !!favorite
    });
    
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking favorite status',
      error: error.message
    });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const { userId, favoriId } = req.body;
    console.log('Toggle favorite request:', { userId, favoriId });
    
    if (!userId || !favoriId) {
      return res.status(400).json({
        success: false,
        message: 'userId and favoriId are required'
      });
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(favoriId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const favorite = await Favorite.findOne({ userId, favoriId });
    if (favorite) {
      await Favorite.deleteOne({ userId, favoriId });
      console.log('Removed favorite');
      res.status(200).json({
        success: true,
        isFavorited: false,
        message: 'Item removed from favorites'
      });
    } else {
      await Favorite.create({ userId, favoriId });
      console.log('Added favorite');
      res.status(200).json({
        success: true,
        isFavorited: true,
        message: 'Item added to favorites'
      });
    }
    
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling favorite',
      error: error.message
    });
  }
};