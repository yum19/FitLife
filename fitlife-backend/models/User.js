const mongoose = require('mongoose');
const allergiesEnum = [
  "peanuts",
  "tree_nuts",
  "milk",
  "eggs",
  "fish",
  "crustaceans",
  "mollusks",
  "wheat",
  "soy",
  "sesame"
];
const ObjectifsEnum = [
  "weight loss",
  "muscle gain",
  "toning"
];
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  motDePasse: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  nom: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  sexe: {
    type: String,
    enum: ['homme', 'femme'],
    required: true
  },
  taille: {
    type: Number // cm
  },
  poids: {
    type: Number // kg
  },
  profilePhoto:{
    type: String, 

  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  // role-based behavior
  role: {
    type: String,
    enum: ['client', 'admin', 'coach', 'nutritionniste'],
    required: true
  },
  // Fields specific to "client"

  objectif: 
    {
      type: String,
      enum: ObjectifsEnum
    },
  allergies: [
    {
      type: String,
      enum: allergiesEnum
    }
  ],
  niveauActivite: {
    type: String,
    enum: ['sédentaire', 'légèrement actif', 'modérément actif', 'très actif', 'extrêmement actif'],
  },
  // Fields for "coach" and "nutritionniste"
  certifications: [String],
  specialites: [String],
  disponible: Boolean,
  // fields for reset password
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, 
{
  timestamps: true
});


module.exports = mongoose.model('User', userSchema);