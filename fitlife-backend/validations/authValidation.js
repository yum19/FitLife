const yup = require("yup");

const registerSchema = yup.object({
  email: yup.string().email().required(),
  motDePasse: yup.string().min(6).required(),
  nom: yup.string().required(),
  prenom: yup.string().required(),
  age: yup.number().min(10).max(100),
  sexe: yup.string().oneOf(["homme", "femme"]),
  taille: yup.number().min(100).max(250),
  poids: yup.number().min(30).max(250),
  role: yup.string().oneOf(["client", "admin","coach","nutritionniste"]),
  objectif: yup.string(),
  allergies: yup.array().of(yup.string())
});

const loginSchema = yup.object({
  email: yup.string().email().required(),
  motDePasse: yup.string().required()
});

const updateProfileSchema = yup.object({
  email: yup.string().email(),
  motDePasse: yup.string().min(6),
  nom: yup.string(),
  prenom: yup.string(),
  age: yup.number().min(10).max(100),
  sexe: yup.string().oneOf(["homme", "femme"]),
  taille: yup.number().min(100).max(250),
  poids: yup.number().min(30).max(250),
  objectif: yup.string(),
  allergies: yup.array().of(yup.string())
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema
};
