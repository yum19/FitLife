const express = require("express");
const router = express.Router();
const { ajouterProgression, getAllProgressions, getProgressionById, updateProgression, deleteProgression, getProgressionsByTypeAndDate , getProgressionsByClientId} = require("../controllers/progressionController");
const { auth } = require("../middleware/auth");

router.post("/add", auth, ajouterProgression);
router.get("/", auth, getAllProgressions);
router.get("/:id", auth, getProgressionById);
router.put("/:id", auth, updateProgression);
router.delete("/:id", auth, deleteProgression);
router.get("/type/:type", auth, getProgressionsByTypeAndDate);
router.get("/client/:clientId", auth, getProgressionsByClientId); // New route

module.exports = router;

