const mongoose = require("mongoose")

const exerciceSchema = new mongoose.Schema({
  // Supprimez l'option { _id: false } ici.
  // Mongoose inclura par défaut un champ _id pour les sous-documents
  // si vous ne le désactivez pas explicitement.
  _id: String,
  nom: String,
  instructions: String,
  repetitions: String,
  duree: { type: Number, default: 45 },
  imageUrl: String,
  videoUrl: String,
  // Si vous avez besoin de l'ID original de Wger pour chaque exercice, vous pouvez l'ajouter ici:
  // wgerId: Number,
})

const seanceSchema = new mongoose.Schema({
  programmeId: { type: mongoose.Schema.Types.ObjectId, ref: "ProgrammeSport", required: true },
  date: { type: Date, default: Date.now },
  exercices: [exerciceSchema], // Cette array stockera maintenant correctement les _id pour chaque sous-document
  duree: { type: Number },
  note: String,
  status: { type: String, enum: ["planned", "completed"], default: "planned" },
})

module.exports = mongoose.model("Seance", seanceSchema)
