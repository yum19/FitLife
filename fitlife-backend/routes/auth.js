const express = require("express");
const router = express.Router();
const { auth, checkRoles } = require("../middleware/auth");

const validate = require("../middleware/validate");
const upload = require("../middleware/upload");
const {
  registerSchema,
  loginSchema,
  updateProfileSchema
} = require("../validations/authValidation");

const {
  login,
  register,
  getAllUsers,
  updateProfile,
  forgotPassword,
  resetPassword,
  getUserById
  , blockUser,
  unblockUser,
  calculateBMR,
  calculateTDEE,
  getProfile,
} = require("../controllers/authController");

// Register
router.post("/register", validate(registerSchema), register);

// Login
router.post("/login", validate(loginSchema), login);

// Get all users (admin only)
router.get("/users", auth, checkRoles(["admin"]), getAllUsers);

// Update user profile
router.put("/users", auth, upload.single("profilePhoto"),validate(updateProfileSchema), updateProfile);
router.put("/updateprofile", auth, upload.single("profilePhoto"), updateProfile)

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password
router.put("/reset-password/:token", resetPassword);

router.get("/getprofile", auth, getProfile)

//get user by id
router.get("/:id", auth, getUserById);

// Block user (admin only)
router.put("/block/:id",auth , blockUser );

// Unblock user (admin only)
router.put("/unblock/:id", auth, unblockUser);

// Calculate BMR
router.post("/calculate-bmr", auth, calculateBMR);

// Calculate TDEE
router.post("/calculate-tdee", auth, calculateTDEE);




module.exports = router;