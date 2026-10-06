const { body, query, validationResult } = require("express-validator")

// Validation pour la recherche de salles à proximité
const validateNearbySearch = [
  query("latitude").isFloat({ min: -90, max: 90 }).withMessage("Latitude doit être un nombre entre -90 et 90"),
  query("longitude").isFloat({ min: -180, max: 180 }).withMessage("Longitude doit être un nombre entre -180 et 180"),
  query("radius").optional().isInt({ min: 100, max: 50000 }).withMessage("Le rayon doit être entre 100m et 50km"),
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      })
    }
    next()
  },
]

// Validation pour la recherche par texte
const validateTextSearch = [
  query("query")
    .isLength({ min: 2, max: 100 })
    .withMessage("Le terme de recherche doit contenir entre 2 et 100 caractères"),
  query("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude doit être un nombre entre -90 et 90"),
  query("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude doit être un nombre entre -180 et 180"),
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      })
    }
    next()
  },
]

module.exports = {
  validateNearbySearch,
  validateTextSearch,
}
