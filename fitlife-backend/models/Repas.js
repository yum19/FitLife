const mongoose = require('mongoose');

const repasSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['petit-dejeuner', 'dejeuner', 'diner', 'collation'], 
    required: true 
  },
  aliments: [{
    aliment: { type: mongoose.Schema.Types.ObjectId, ref: 'Aliment' },
    quantite: Number // en grammes
  }],
  totalCalories: Number,
  totalGlucides: Number,
  totalProteines: Number,
  totalLipides: Number
}, { timestamps: true });

module.exports = mongoose.model('Repas', repasSchema);
