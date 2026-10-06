const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  categorie: {
    type: String,
    enum: ['Food supplements', 'Sports material'],
    required: true
  },
  marque: {
    type: String,
    required: true
  },
  prix: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Produit', produitSchema);