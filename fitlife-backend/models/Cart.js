const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: String,  // Keep as String since that's what you're using
    required: true,
    unique: true,
  },
  prixTotal: {
    type: Number,
    required: true,
    default: 0.0,
  },
  items: [{
    produitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Produit',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    }
  }],
});

cartSchema.methods.ajouterArticle = async function(produitId, quantity = 1) {
  const existingItem = this.items.find(item =>
    item.produitId.toString() === produitId
  );
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({ produitId, quantity });
  }
  await this.calculerTotal();
  return this.save();
};

cartSchema.methods.supprimerArticle = async function(produitId) {
  const itemIndex = this.items.findIndex(item =>
    item.produitId.toString() === produitId
  );
  if (itemIndex !== -1) {
    const item = this.items[itemIndex];
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      this.items.splice(itemIndex, 1);
    }
    await this.calculerTotal();
    return this.save();
  }
  return this;
};

cartSchema.methods.calculerTotal = async function() {
  const Produit = this.model('Produit');
  let total = 0;
  for (const item of this.items) {
    const prod = await Produit.findById(item.produitId);
    if (prod) {
      total += item.quantity * prod.prix;
    }
  }
  this.prixTotal = parseFloat(total.toFixed(2));
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);