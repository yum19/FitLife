// models/Favorite.js
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: String, // or mongoose.Schema.Types.ObjectId if you want to reference User model
    required: true
  },
  favoriId: {
    type: String, // Changed from Number to String to store MongoDB ObjectId as string
    required: true
  }
}, {
  timestamps: true // This will add createdAt and updatedAt fields
});

// Compound index to ensure one user can't favorite the same item twice
favoriteSchema.index({ userId: 1, favoriId: 1 }, { unique: true });

// Instance method to add favorite (called on document instance)
favoriteSchema.methods.ajouterFavori = function() {
  return this.save();
};

// Instance method to remove favorite
favoriteSchema.methods.supprimerFavori = function() {
  return this.deleteOne();
};

// Static methods (called on the model)
favoriteSchema.statics.ajouterFavoriStatic = function(userId, favoriId) {
  return this.create({ userId, favoriId });
};

favoriteSchema.statics.supprimerFavoriStatic = function(userId, favoriId) {
  return this.deleteOne({ userId, favoriId });
};

// Get all favorites for a user
favoriteSchema.statics.getUserFavorites = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Check if item is favorited by user
favoriteSchema.statics.isFavorited = function(userId, favoriId) {
  return this.findOne({ userId, favoriId });
};

module.exports = mongoose.model('Favorite', favoriteSchema);