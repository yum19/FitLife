import * as Location from "expo-location"
import type { Location as LocationType } from "../types/gym"

export class LocationService {
  static async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      return status === "granted"
    } catch (error) {
      console.error("Erreur lors de la demande de permission:", error)
      return false
    }
  }

  static async getCurrentLocation(): Promise<LocationType> {
    try {
      const hasPermission = await this.requestLocationPermission()

      if (!hasPermission) {
        throw new Error("Permission de localisation refusée")
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la position:", error)
      throw error
    }
  }

  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  static formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`
    }
    return `${distance.toFixed(1)}km`
  }
}
