const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { auth } = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(auth);

// Cart routes
router.get("/", cartController.getOrCreateCart);
router.post("/add", cartController.ajouterArticle);
router.post("/update", cartController.updateQuantity); // New route for updating quantity
router.post("/remove", cartController.supprimerArticle);
router.get("/total", cartController.calculerTotal);

module.exports = router;