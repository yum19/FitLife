const mongoose = require('mongoose');

const planNutritionSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  objectif: { 
    type: String, 
    enum: ['perte_de_poids', 'maintien', 'prise_de_masse'], 
    required: true 
  },
  caloriesCible: Number,
  repartitionMacros: {
    glucides: Number, // %
    proteines: Number, // %
    lipides: Number // %
  },
  repas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Repas' }],
}, { timestamps: true });

module.exports = mongoose.model('PlanNutrition', planNutritionSchema);
