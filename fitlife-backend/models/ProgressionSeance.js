const mongoose = require('mongoose');

const progressionSeanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  seanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seance',
    required: true,
  },
  exercicesRealises: [
    {
      exerciceId: String,
      series: Number,
      repetitions: Number,
      poids: Number,
      temps: Number,
    }
  ],
  dureeReelle: Number, // en minutes
  statut: {
    type: String,
    enum: ['completed', 'in progress', 'abandoned'],
    default: 'completed',
  },
  date: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('ProgressionSeance', progressionSeanceSchema);
