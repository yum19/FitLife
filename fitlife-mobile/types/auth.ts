export interface User {
    _id: string
    email: string
    prenom: string
    nom: string
    age: number
    sexe: string
    taille: number
    poids: number
    role: string
    objectif: string
    allergies: string[]
    certifications: string[]
    specialites: string[]
    disponible: boolean
    niveauActivite: string;
    profilePhoto: string;
    isBlocked: boolean;
  }
  
export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
} 