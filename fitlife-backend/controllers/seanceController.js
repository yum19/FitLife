const Seance = require('../models/Seance');
const ProgrammeSport = require('../models/ProgrammeSport');
const ProgressionSeance = require('../models/ProgressionSeance');

exports.marquerCommeTerminee = async (req, res) => {
  try {
    const seanceId = req.params.id;

    const seance = await Seance.findById(seanceId);
    if (!seance) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const programme = await ProgrammeSport.findById(seance.programmeId);
    if (!programme) {
      return res.status(404).json({ message: 'Associated programme not found' });
    }

    if (req.user.role !== 'admin' && programme.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: this session does not belong to you' });
    }

    seance.status = 'completed';
    await seance.save();

    res.json({ message: 'Session successfully updated', seance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSeancesUtilisateur = async (req, res) => {
  try {
    let seances = [];

    if (req.user.role === 'admin') {
      // L'admin voit tout
      seances = await Seance.find().populate({
        path: 'programmeId',
        select: 'objectif niveau userId',
        populate: { path: 'userId', select: 'prenom nom email' }
      });
    } else {
      // Utilisateur : récupérer ses propres séances via ses programmes
      const programmes = await ProgrammeSport.find({ userId: req.user.id }, '_id');
      const programmeIds = programmes.map(p => p._id);

      seances = await Seance.find({ programmeId: { $in: programmeIds } }).populate({
        path: 'programmeId',
        select: 'objectif niveau'
      });
    }

    res.json(seances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.modifierDateSeance = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body;

    const seance = await Seance.findById(id);
    if (!seance) return res.status(404).json({ error: 'Séance non trouvée' });

    const programme = await ProgrammeSport.findById(seance.programmeId);
    if (!programme) return res.status(404).json({ error: 'Programme non trouvé' });

    if (req.user.role !== 'admin' && programme.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    // Date reçue en ISO string, tu peux la transformer en Date objet :
    seance.date = new Date(date);

    await seance.save();

    res.json(seance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSeanceById = async (req, res) => {
  try {
    const seance = await Seance.findById(req.params.id).populate("programmeId");

    if (!seance) {
      return res.status(404).json({ error: "Séance non trouvée" });
    }

    const programme = await ProgrammeSport.findById(seance.programmeId);
    if (!programme) {
      return res.status(404).json({ error: "Programme non trouvé" });
    }

    if (req.user.role !== "admin" && programme.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    res.json(seance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.ajouterProgression = async (req, res) => {
  try {
    const { seanceId, exercicesRealises, dureeReelle, statut } = req.body;
    const userId = req.user.id;

    const progression = await ProgressionSeance.create({
      userId,
      seanceId,
      exercicesRealises,
      dureeReelle,
      statut,
    });

    res.status(201).json(progression);
  } catch (error) {
    console.error('Error while adding session progress:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getHistoriqueUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const historique = await ProgressionSeance.find({ userId }).populate('seanceId');

    res.json(historique);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};