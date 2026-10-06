const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/users/roles?roles=coach,nutritionniste

router.get('/roles', async (req, res) => {

  try {
    const roles = req.query.roles?.split(',') || [];
    const users = await User.find({ role: { $in: roles } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Route GET /users/coachs
router.get('/coachs', async (req, res) => {
  try {
    const coachs = await User.find({ role: 'coach' }).select('-motDePasse'); // on masque le mot de passe
    res.status(200).json(coachs);
  } catch (error) {
    console.error('Erreur lors de la récupération des coachs:', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET /users/coachs/:id - récupérer un coach par son ID
router.get('/coachs/:id', async (req, res) => {
  try {
    const coach = await User.findOne({ _id: req.params.id, role: 'coach' }).select('-motDePasse');
    if (!coach) {
      return res.status(404).json({ message: 'Coach non trouvé' });
    }
    res.json(coach);
  } catch (error) {
    console.error('Erreur lors de la récupération du coach :', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
