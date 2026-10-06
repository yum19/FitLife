import axios, { type AxiosResponse } from "axios"
import type { Gym, ApiResponse } from "../types/gym"

// Configuration de l'API
const API_BASE_URL = "http://192.168.1.8:5000/api" // Changez selon votre configuration

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    console.error("Erreur API:", error.response?.data || error.message)
    return Promise.reject(error)
  },
)

export const gymService = {
  // Rechercher des salles de sport à proximité
  async searchNearbyGyms(latitude: number, longitude: number, radius = 5000): Promise<Gym[]> {
    try {
      const response = await api.get<ApiResponse<Gym[]>>("/gyms/nearby", {
        params: {
          latitude,
          longitude,
          radius,
        },
      })
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erreur lors de la recherche")
    }
  },

  // Obtenir les détails d'une salle de sport
  async getGymDetails(gymId: string): Promise<Gym> {
    try {
      const response = await api.get<ApiResponse<Gym>>(`/gyms/${gymId}`)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erreur lors de la récupération des détails")
    }
  },
}

export default api
