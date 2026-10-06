const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produitController');

// Get all produits
router.get('/', produitController.getAllProduits);

router.post('/by-ids', produitController.getProductsByIds);


// Get a single produit by ID
router.get('/:id', produitController.getProduitById);

// Create a new produit
router.post('/', produitController.createProduit);

// Update a produit
router.put('/:id', produitController.updateProduit);

// Delete a produit
router.delete('/:id', produitController.deleteProduit);

module.exports = router;