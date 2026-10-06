// models/Progression.js

const mongoose = require("mongoose");

const progressionSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["poids", "menstruation", "calories_brulees", "stress", "sommeil"],
    required: true
  },
  valeur: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  unite: {
    type: String
  },
  dateEnregistrement: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Progression", progressionSchema);
