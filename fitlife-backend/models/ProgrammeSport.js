const mongoose = require('mongoose');

const programmeSportSchema = new mongoose.Schema({
 userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  objectif: { type: String, required: true },
  niveau: { type: String, required: true },
  materiel: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  actif: { type: Boolean, default: true },
  frequency: String,
  duration: String
});

module.exports = mongoose.model('ProgrammeSport', programmeSportSchema);
