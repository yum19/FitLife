const mongoose = require('mongoose');

// ---------- Sous-schemas ----------
const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },      // Nom de l'ingrédient
  amount: { type: Number, required: true },    // Quantité
  unit: { type: String },                      // Unité (g, ml, cup…)
  image: { type: String }                      // URL image Spoonacular
}, { _id: false });

const instructionStepSchema = new mongoose.Schema({
  number: { type: Number },                    // Numéro de l'étape
  step: { type: String, required: true }       // Description de l'étape
}, { _id: false });

// ---------- Schéma principal ----------
const alimentSchema = new mongoose.Schema({
  nom: { type: String, required: true },        // Nom du plat ou recette
  calories: { type: Number, required: true },
  glucides: { type: Number, required: true },
  proteines: { type: Number, required: true },
  lipides: { type: Number, required: true },
  portion: { type: String },                    // ex: "100g", "1 cup"
  image: { type: String },                      // URL image Spoonacular
  ingredients: [ingredientSchema],              // Liste des ingrédients
  instructions: [instructionStepSchema],        // Étapes de préparation
}, { timestamps: true });

module.exports = mongoose.model('Aliment', alimentSchema);
