const mongoose = require('mongoose');

const exerciceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: String,
  difficulty: String,
  equipment: [{ type: String }],
  imageUrl: String,
  wgerId: Number,
});

module.exports = mongoose.model('Exercice', exerciceSchema);
