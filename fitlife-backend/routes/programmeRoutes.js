const express = require('express');
const router = express.Router();
const programmeController = require('../controllers/programmeController');
const { auth, checkRoles } = require('../middleware/auth');

router.post('/generate', auth, programmeController.genererProgramme);

router.get('/', auth, programmeController.lireTousLesProgrammes);

router.get('/:id', auth, programmeController.lireProgrammeParId);

router.put('/:id', auth, programmeController.mettreAJourProgramme);

router.delete('/:id', auth, programmeController.supprimerProgramme);



module.exports = router;
