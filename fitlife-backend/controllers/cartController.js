const Cart = require('../models/Cart');
const Produit = require('../models/Produit');

// Create or get cart for a user
exports.getOrCreateCart = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id.toString();
    let cart = await Cart.findOne({ userId }).populate('items.produitId');

    if (!cart) {
      cart = new Cart({ userId });
      await cart.save();
    }
    
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({ message: error.message });
  }
};

// Add item to cart
exports.ajouterArticle = async (req, res) => {
  try {
    const { produitId, quantity = 1 } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id.toString();
    
    // Validate required fields
    if (!produitId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Validate product exists
    const produit = await Produit.findById(produitId);
    if (!produit) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId });
    }

    // Find existing item with same product
    const existingItem = cart.items.find(item => 
      item.produitId.toString() === produitId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ produitId, quantity });
    }

    await cart.calculerTotal();
    await cart.save();
    await cart.populate('items.produitId');
    
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update item quantity in cart
exports.updateQuantity = async (req, res) => {
  try {
    const { produitId, quantity } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id.toString();
    
    if (!produitId || quantity < 1) {
      return res.status(400).json({ message: 'Invalid product ID or quantity' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(item => 
      item.produitId.toString() === produitId
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    item.quantity = quantity;

    await cart.calculerTotal();
    await cart.save();
    await cart.populate('items.produitId');
    
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ message: error.message });
  }
};

// Remove item from cart
exports.supprimerArticle = async (req, res) => {
  try {
    const { produitId } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id.toString();
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => 
      item.produitId.toString() === produitId
    );

    if (itemIndex !== -1) {
      cart.items.splice(itemIndex, 1); // Remove item completely
      await cart.calculerTotal();
      await cart.save();
    }

    await cart.populate('items.produitId');
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: error.message });
  }
};

// Calculate and update total
exports.calculerTotal = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id.toString();
    const cart = await Cart.findOne({ userId }).populate('items.produitId');

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    await cart.calculerTotal();
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error calculating total:", error);
    res.status(500).json({ message: error.message });
  }
};