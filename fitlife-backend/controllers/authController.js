const User = require("../models/User")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const sendEmail = require("../utils/sendEmail")

//register
exports.register = async (req, res) => {
  const { email, motDePasse, role, ...rest } = req.body
  try {
    let user = await User.findOne({ email })
    if (user) return res.status(400).json({ msg: "Email already used." })

    if (role === "client") {
      const requiredClientFields = ["objectif", "niveauActivite", "taille", "poids"]
      for (const field of requiredClientFields) {
        if (!rest[field]) {
          return res.status(400).json({ msg: `Missing field '${field}' for client role.` })
        }
      }
    }

    if (role === "coach" || role === "nutritionniste") {
      const requiredCoachFields = ["certifications", "specialites"]
      for (const field of requiredCoachFields) {
        if (!rest[field] || !Array.isArray(rest[field]) || rest[field].length === 0) {
          return res.status(400).json({ msg: `Missing or invalid field '${field}' for ${role} role.` })
        }
      }
    }

    // ✅ Hash the password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(motDePasse, salt)

    // ✅ Create user object
    user = new User({
      email,
      motDePasse: hashedPassword,
      role,
      ...rest,
    })

    await user.save()

    // ✅ Generate token
    const userData = { id: user._id, email: user.email, role: user.role }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" })

    res.json({ token, user: userData })
  } catch (err) {
    console.error(err)
    res.status(500).send("Erreur serveur")
  }
}

// Login
exports.login = async (req, res) => {
  const { email, motDePasse } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ msg: "Identifiants invalides." })

    const isMatch = await bcrypt.compare(motDePasse, user.motDePasse)
    if (!isMatch) return res.status(400).json({ msg: "Identifiants invalides." })

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" })

    const userData = {
      _id: user._id,
      email: user.email,
      prenom: user.prenom,
      nom: user.nom,
      age: user.age,
      sexe: user.sexe,
      taille: user.taille,
      poids: user.poids,
      role: user.role,
      objectif: user.objectif,
      allergies: user.allergies,
      certifications: user.certifications,
      specialites: user.specialites,
      disponible: user.disponible,
      niveauActivite: user.niveauActivite,
      profilePhoto: user.profilePhoto,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    res.json({ token, user: userData })
  } catch (err) {
    console.error(err)
    res.status(500).send("Erreur serveur")
  }
}

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select(
      "email role nom prenom age sexe taille poids objectif allergies certifications specialites disponible createdAt",
    )
    res.json(users)
  } catch (err) {
    console.error(err)
    res.status(500).send("Erreur serveur")
  }
}

// Update profile
exports.updateProfile = async (req, res) => {
  const userId = req.user.id
  const { email, motDePasse, ...rest } = req.body

  try {
    const updatedFields = { ...rest }

    if (email) {
      const existingUser = await User.findOne({ email })
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ msg: "Email déjà utilisé." })
      }
      updatedFields.email = email
    }

    if (motDePasse) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(motDePasse, salt)
      updatedFields.motDePasse = hashedPassword
    }

    // ✅ AJOUTER CECI → Sauvegarder le chemin de l'image
    if (req.file) {
      updatedFields.profilePhoto = `/uploads/${req.file.filename}`
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updatedFields },
      { new: true, runValidators: true },
    ).select("-motDePasse")

    if (!user) {
      return res.status(404).json({ msg: "Utilisateur non trouvé" })
    }

    console.log("Profile updated successfully:", user.objectif)
    res.json({ msg: "Profil mis à jour avec succès", user })
  } catch (err) {
    console.error("Error updating profile:", err)
    res.status(500).json({
      msg: "Erreur serveur",
      error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    })
  }
}

// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ msg: "Email non trouvé." })

    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex")

    user.resetPasswordToken = resetTokenHash
    user.resetPasswordExpire = Date.now() + 3600000 // 1 hour
    await user.save()

    const resetLink = `http://localhost:5173/auth/reset-password/${resetToken}`
    const html = `
      <h3>Réinitialisation du mot de passe</h3>
      <p>Bonjour ${user.nom || "utilisateur"},</p>
      <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Ce lien expire dans 1 heure.</p>
    `

    await sendEmail(user.email, "Réinitialisation du mot de passe", html)
    res.json({ msg: "Email de réinitialisation envoyé." })
  } catch (err) {
    console.error(err)
    res.status(500).send("Erreur serveur")
  }
}

// Reset Password
exports.resetPassword = async (req, res) => {
  const { token } = req.params
  const { motDePasse } = req.body

  try {
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex")
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) return res.status(400).json({ msg: "Token invalide ou expiré." })

    const salt = await bcrypt.genSalt(10)
    user.motDePasse = await bcrypt.hash(motDePasse, salt)
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    res.json({ msg: "Mot de passe réinitialisé avec succès." })
  } catch (err) {
    console.error(err)
    res.status(500).send("Erreur serveur")
  }
}

//calculate BMR
exports.calculateBMR = (req, res) => {
  const { age, sexe, taille, poids } = req.body

  if (!age || !sexe || !taille || !poids) {
    return res.status(400).json({ msg: "Tous les champs sont requis." })
  }

  let bmr
  if (sexe === "homme") {
    bmr = 88.362 + 13.397 * poids + 4.799 * taille - 5.677 * age
  } else {
    bmr = 447.593 + 9.247 * poids + 3.098 * taille - 4.33 * age
  }

  res.json({ bmr })
}

//calculate TDEE
// i use the logic that i found it here https://www.calculator.net/tdee-calculator.html
exports.calculateTDEE = (req, res) => {
  const { bmr, niveauActivite } = req.body

  if (!bmr || !niveauActivite) {
    return res.status(400).json({ msg: "BMR et niveau d'activité requis." })
  }

  let tdee
  switch (niveauActivite) {
    case "sédentaire":
      tdee = bmr * 1.2
      break
    case "légèrement actif":
      tdee = bmr * 1.375
      break
    case "modérément actif":
      tdee = bmr * 1.55
      break
    case "très actif":
      tdee = bmr * 1.725
      break
    case "extrêmement actif":
      tdee = bmr * 1.9
      break
    default:
      return res.status(400).json({ msg: "Niveau d'activité invalide." })
  }

  res.json({ tdee })
}

// userController.js (add to existing file)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "email role nom prenom age sexe taille poids objectif allergies certifications specialites disponible createdAt updatedAt profilePhoto isBlocked niveauActivite",
    )

    if (!user) {
      return res.status(404).json({ msg: "Utilisateur non trouvé" })
    }

    // Check if the requester is an admin or the user themselves
    if (req.user.role !== "admin" && req.user.id !== user._id.toString()) {
      return res.status(403).json({ msg: "Accès non autorisé" })
    }

    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).send("Erreur serveur")
  }
}

//block user
// Block a user (admin only)
exports.blockUser = async (req, res) => {
  try {
    const userId = req.params.id

    // Only admin can block a user
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Accès non autorisé" })
    }

    const user = await User.findByIdAndUpdate(userId, { isBlocked: true }, { new: true }).select("-motDePasse")

    if (!user) {
      return res.status(404).json({ msg: "Utilisateur non trouvé" })
    }

    res.json({ msg: "Utilisateur bloqué avec succès", user })
  } catch (err) {
    console.error(err)
    res.status(500).send("Erreur serveur")
  }
}

//unblock a user (admin only)
exports.unblockUser = async (req, res) => {
  try {
    const userId = req.params.id

    // Only admin can unblock a user
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Accès non autorisé" })
    }

    const user = await User.findByIdAndUpdate(userId, { isBlocked: false }, { new: true }).select("-motDePasse")

    if (!user) {
      return res.status(404).json({ msg: "Utilisateur non trouvé" })
    }

    res.json({ msg: "Utilisateur débloqué avec succès", user })
  } catch (err) {
    console.error(err)
    res.status(500).send("Erreur serveur")
  }
}

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    console.log("Getting profile for user ID:", req.user.id)

    const user = await User.findById(req.user.id).select(
      "email role nom prenom age sexe taille poids objectif allergies certifications specialites disponible createdAt updatedAt profilePhoto isBlocked niveauActivite",
    )

    if (!user) {
      console.log("User not found for ID:", req.user.id)
      return res.status(404).json({ msg: "Utilisateur non trouvé" })
    }

    console.log("Profile found for user:", user.email)
    res.json(user)
  } catch (err) {
    console.error("Error in getProfile:", err)
    res.status(500).json({
      msg: "Erreur serveur",
      error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    })
  }
}
