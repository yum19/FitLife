const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/NutritionPlanController');
const { auth, checkRoles } = require('../middleware/auth');

// Route for searching aliments from OpenFoodFacts
router.get('/search-aliment', auth, nutritionController.searchAliment);

// Route for manual creation of nutrition plan
router.post('/create-plan', auth, nutritionController.createPlan);

// Route for automatic generation of nutrition plan
router.post('/generate-plan-auto',  nutritionController.generatePlanAuto);

router.post('/generate-weekly-plan',  nutritionController.generateWeeklyPlan);

module.exports = router;
