const Progression = require("../models/Progression");
const typeMetadata = require("../models/TypeMetadata");

exports.ajouterProgression = async (req, res) => {
  const { type, valeur, notes } = req.body;
  const clientId = req.user.id;

  const metadata = typeMetadata[type];
  if (!metadata) return res.status(400).json({ message: "Type invalide" });

  if (typeof valeur !== "object" && metadata.schema.type && typeof valeur !== metadata.schema.type) {
    return res.status(400).json({ message: `Valeur invalide pour le type ${type}` });
  }

  if (type === "stress" && (valeur < 0 || valeur > 10)) {
    return res.status(400).json({ message: "Stress doit être entre 0 et 10" });
  }

  if (type === "menstruation") {
    const { jourDuCycle, douleurs, intensiteDouleur } = valeur;
    if (
      typeof jourDuCycle !== "number" ||
      typeof douleurs !== "boolean" ||
      !metadata.schema.intensiteDouleur.includes(intensiteDouleur)
    ) {
      return res.status(400).json({ message: "Structure de menstruation invalide" });
    }
  }

  if (type === "sommeil") {
    const { heures, qualite } = valeur;
    if (
      typeof heures !== "number" ||
      !metadata.schema.qualite.includes(qualite)
    ) {
      return res.status(400).json({ message: "Structure de sommeil invalide" });
    }
  }

  try {
    const progression = new Progression({
      clientId,
      type,
      valeur,
      unite: metadata.unite || null,
      notes
    });
    await progression.save();
    res.status(201).json(progression);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.getAllProgressions = async (req, res) => {
  const { type, startDate, endDate, sort = "-dateEnregistrement" } = req.query;
  const clientId = req.user.id;

  const query = { clientId };
  if (type) {
    if (!typeMetadata[type]) return res.status(400).json({ message: "Type invalide" });
    query.type = type;
  }
  if (startDate || endDate) {
    query.dateEnregistrement = {};
    if (startDate) query.dateEnregistrement.$gte = new Date(startDate);
    if (endDate) query.dateEnregistrement.$lte = new Date(endDate);
  }

  try {
    const progressions = await Progression.find(query)
      .populate('clientId', 'nom email')
      .sort(sort);
    res.status(200).json(progressions);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.getProgressionById = async (req, res) => {
  try {
    const progression = await Progression.findOne({
      _id: req.params.id,
      clientId: req.user.id
    }).populate('clientId', 'nom email');
    
    if (!progression) {
      return res.status(404).json({ message: "Progression non trouvée" });
    }
    res.status(200).json(progression);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.updateProgression = async (req, res) => {
  const { type, valeur, notes } = req.body;
  const clientId = req.user.id;

  const metadata = typeMetadata[type];
  if (!metadata) return res.status(400).json({ message: "Type invalide" });

  if (typeof valeur !== "object" && metadata.schema.type && typeof valeur !== metadata.schema.type) {
    return res.status(400).json({ message: `Valeur invalide pour le type ${type}` });
  }

  if (type === "stress" && (valeur < 0 || valeur > 10)) {
    return res.status(400).json({ message: "Stress doit être entre 0 et 10" });
  }

  if (type === "menstruation") {
    const { jourDuCycle, douleurs, intensiteDouleur } = valeur;
    if (
      typeof jourDuCycle !== "number" ||
      typeof douleurs !== "boolean" ||
      !metadata.schema.intensiteDouleur.includes(intensiteDouleur)
    ) {
      return res.status(400).json({ message: "Structure de menstruation invalide" });
    }
  }

  if (type === "sommeil") {
    const { heures, qualite } = valeur;
    if (
      typeof heures !== "number" ||
      !metadata.schema.qualite.includes(qualite)
    ) {
      return res.status(400).json({ message: "Structure de sommeil invalide" });
    }
  }

  try {
    const progression = await Progression.findOneAndUpdate(
      { _id: req.params.id, clientId },
      {
        type,
        valeur,
        unite: metadata.unite || null,
        notes,
        dateEnregistrement: new Date()
      },
      { new: true }
    );

    if (!progression) {
      return res.status(404).json({ message: "Progression non trouvée" });
    }
    res.status(200).json(progression);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.deleteProgression = async (req, res) => {
  try {
    const progression = await Progression.findOneAndDelete({
      _id: req.params.id,
      clientId: req.user.id
    });

    if (!progression) {
      return res.status(404).json({ message: "Progression non trouvée" });
    }
    res.status(200).json({ message: "Progression supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.getProgressionsByTypeAndDate = async (req, res) => {
  const { startDate, endDate, aggregate } = req.query;
  const clientId = req.user.id;
  const type = req.params.type; // Use req.params.type instead of req.query.type

  if (!typeMetadata[type]) {
    return res.status(400).json({ message: "Type invalide" });
  }

  const query = { clientId, type };
  if (startDate || endDate) {
    query.dateEnregistrement = {};
    if (startDate) query.dateEnregistrement.$gte = new Date(startDate);
    if (endDate) query.dateEnregistrement.$lte = new Date(endDate);
  }

  try {
    const progressions = await Progression.find(query)
      .populate('clientId', 'nom email')
      .sort({ dateEnregistrement: -1 });

    if (aggregate) {
      if (!["poids", "calories_brulees", "stress"].includes(type)) {
        return res.status(400).json({ message: "Agrégation non supportée pour ce type" });
      }
      const values = progressions.map(p => p.valeur);
      let result;
      if (aggregate === "avg") {
        const sum = values.reduce((acc, val) => acc + val, 0);
        result = { average: values.length ? sum / values.length : 0, unite: typeMetadata[type].unite };
      } else if (aggregate === "sum") {
        result = { sum: values.reduce((acc, val) => acc + val, 0), unite: typeMetadata[type].unite };
      } else {
        return res.status(400).json({ message: "Type d'agrégation invalide" });
      }
      return res.status(200).json(result);
    }

    res.status(200).json(progressions);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// New method to get progressions by clientId
exports.getProgressionsByClientId = async (req, res) => {
  const { clientId } = req.params; // Get clientId from URL parameter
  const { type, startDate, endDate, sort = "-dateEnregistrement" } = req.query;

  const query = { clientId };
  if (type) {
    if (!typeMetadata[type]) return res.status(400).json({ message: "Type invalide" });
    query.type = type;
  }
  if (startDate || endDate) {
    query.dateEnregistrement = {};
    if (startDate) query.dateEnregistrement.$gte = new Date(startDate);
    if (endDate) query.dateEnregistrement.$lte = new Date(endDate);
  }

  try {
    // Check if the requesting user is an admin or the client themselves
    if (req.user.role !== "admin" && req.user.id !== clientId) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const progressions = await Progression.find(query)
      .populate('clientId', 'nom email')
      .sort(sort);

    res.status(200).json(progressions);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};


