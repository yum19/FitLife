const express = require('express');
const router = express.Router();
const { marquerCommeTerminee, getSeancesUtilisateur, modifierDateSeance, getSeanceById ,ajouterProgression, getHistoriqueUser} = require('../controllers/seanceController');
const { auth } = require('../middleware/auth');

router.patch('/:id/terminer', auth, marquerCommeTerminee);
router.get('/', auth, getSeancesUtilisateur);
router.put('/:id', auth, modifierDateSeance);
router.get('/:id', auth, getSeanceById);
router.post('/', auth, ajouterProgression);
router.get('/historique', auth, getHistoriqueUser);


module.exports = router;
