const Produit = require('../models/Produit');

exports.getAllProduits = async (req, res) => {
  try {
    const produits = await Produit.find();
    res.status(200).json(produits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProduitById = async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);
    if (!produit) return res.status(404).json({ message: 'Produit not found' });
    res.status(200).json(produit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProduit = async (req, res) => {
  const { nom, categorie, marque, prix, description, image } = req.body;
  try {
    const newProduit = new Produit({ nom, categorie, marque, prix, description, image });
    const savedProduit = await newProduit.save();
    res.status(201).json(savedProduit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateProduit = async (req, res) => {
  try {
    const updatedProduit = await Produit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedProduit) return res.status(404).json({ message: 'Produit not found' });
    res.status(200).json(updatedProduit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteProduit = async (req, res) => {
  try {
    const deletedProduit = await Produit.findByIdAndDelete(req.params.id);
    if (!deletedProduit) return res.status(404).json({ message: 'Produit not found' });
    res.status(200).json({ message: 'Produit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add this to your existing controllers/produitController.js

const mongoose = require('mongoose');

// Add this method to your existing produitController.js
exports.getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: 'ids array is required'
      });
    }

    console.log('Received IDs:', ids);
    
    // Convert to ObjectIds for MongoDB _id field
    const objectIds = ids.map(id => {
      if (mongoose.Types.ObjectId.isValid(id)) {
        return new mongoose.Types.ObjectId(id);
      }
      return null;
    }).filter(id => id !== null);
    
    console.log('Valid ObjectIds:', objectIds);
    
    // Fetch products by _id field (MongoDB default)
    const products = await Produit.find({ _id: { $in: objectIds } });
    
    console.log('Found products:', products.length);
    
    res.status(200).json({
      success: true,
      products: products
    });
  } catch (error) {
    console.error('Error fetching products by IDs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
};