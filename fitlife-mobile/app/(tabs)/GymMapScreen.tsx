"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Alert, TouchableOpacity, Dimensions, StatusBar, Linking } from "react-native"
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps"
import { ActivityIndicator } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { router } from "expo-router"
import type { Gym, Location } from "@/types/gym"
import { gymService } from "@/services/api"
import { LocationService } from "@/services/locationService"

const colors = {
  // Couleurs principales
  primary: "#F97316",
  primaryLight: "#FF9500", 
  primaryDark: "#D84315",
  primaryUltraLight: "#FFF3E0",
  
  // Couleurs secondaires
  secondary: "#263238",
  secondaryLight: "#37474F",
  tertiary: "#FF9800",
  
  // Couleurs de surface
  background: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceVariant: "#F5F5F5",
  surfaceDark: "#EEEEEE",
  
  // Couleurs de texte (plus contrastées)
  onSurface: "#212121",
  onSurfaceVariant: "#424242",
  onSurfaceLight: "#616161",
  onSurfaceMuted: "#9E9E9E",
  
  // Couleurs d'accent
  accent: "#FFF8E1",
  accentDark: "#FFCC02",
  
  // Couleurs d'état
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",
  
  // Ombres et overlays
  shadow: "rgba(255, 87, 34, 0.15)",
  shadowDark: "rgba(33, 33, 33, 0.1)",
  shadowMedium: "rgba(33, 33, 33, 0.15)",
  shadowStrong: "rgba(33, 33, 33, 0.2)",
  overlay: "rgba(33, 33, 33, 0.7)",
  
  // Gradients
  gradient: {
    primary: ["#F97316", "#FF9500"] as const,
    primaryReverse: ["#FF9500", "#F97316"] as const,
    secondary: ["#263238", "#37474F"] as const,
    surface: ["#FFFFFF", "#FAFAFA"] as const,
    accent: ["#FFF8E1", "#FFCC02"] as const,
    warm: ["#FFF3E0", "#FFCC02"] as const,
    cool: ["#FAFAFA", "#F5F5F5"] as const,
  },
}

interface MapScreenProps {
  navigate?: (screenName: string, params?: any) => void
  goBack?: () => void
}

const { width, height } = Dimensions.get("window")
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.0922
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

const MapScreen: React.FC<MapScreenProps> = ({ navigate, goBack }) => {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null)
  const [region, setRegion] = useState<Region>({
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  })
  const [mapRef, setMapRef] = useState<MapView | null>(null)

  useEffect(() => {
    loadGymsAndLocation()
  }, [])

  const loadGymsAndLocation = async (): Promise<void> => {
    try {
      setLoading(true)

      const location = await LocationService.getCurrentLocation()
      setUserLocation(location)

      const newRegion: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }
      setRegion(newRegion)

      const gymsData = await gymService.searchNearbyGyms(location.latitude, location.longitude, 10000)

      setGyms(gymsData)
    } catch (error) {
      console.error("Erreur lors du chargement:", error)
      Alert.alert("Error", "Unable to load data. Check your connection and location permissions.")
    } finally {
      setLoading(false)
    }
  }

  const centerOnUserLocation = (): void => {
    if (userLocation && mapRef) {
      const newRegion: Region = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }
      mapRef.animateToRegion(newRegion, 1000)
    }
  }

  const onMarkerPress = (gym: Gym): void => {
    setSelectedGym(gym)

    if (mapRef) {
      const newRegion: Region = {
        latitude: gym.latitude,
        longitude: gym.longitude,
        latitudeDelta: LATITUDE_DELTA / 2,
        longitudeDelta: LONGITUDE_DELTA / 2,
      }
      mapRef.animateToRegion(newRegion, 1000)
    }
  }

  const formatDistance = (distance: number | undefined): string => {
    if (!distance) return "Distance unknown"
    if (distance < 1000) {
      return `${Math.round(distance)}m`
    }
    return `${(distance / 1000).toFixed(1)}km`
  }

  const navigateToGymDetail = (): void => {
    if (selectedGym) {
      router.push(`/GymDetailScreen?gymId=${selectedGym.id}`)
    }
  }

  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <LinearGradient colors={colors.gradient.primary} style={styles.loadingIcon}>
          <ActivityIndicator size="large" color={colors.surface} />
        </LinearGradient>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    </View>
  )

  const ModernHeader = () => (
    <LinearGradient colors={colors.gradient.primary} style={styles.modernHeader}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <View style={styles.backButtonBg}>
            <Ionicons name="arrow-back" size={24} color={colors.surface} />
          </View>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Gym Map</Text>
          <Text style={styles.headerSubtitle}>Find gyms around you</Text>
        </View>

        <TouchableOpacity style={styles.listButton} onPress={() => router.push("/GymListScreen")} activeOpacity={0.8}>
          <View style={styles.listButtonBg}>
            <Ionicons name="list" size={20} color={colors.surface} />
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader />
        <LoadingScreen />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader />

      <MapView
        ref={setMapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {gyms.map((gym) => (
          <Marker
            key={gym.id}
            coordinate={{
              latitude: gym.latitude,
              longitude: gym.longitude,
            }}
            title={gym.name}
            description={gym.address}
            onPress={() => onMarkerPress(gym)}
          >
            <View style={styles.markerContainer}>
              <LinearGradient
                colors={selectedGym?.id === gym.id ? colors.gradient.primary : colors.gradient.surface}
                style={[styles.marker, selectedGym?.id === gym.id && styles.selectedMarker]}
              >
                <Ionicons
                  name="fitness"
                  size={20}
                  color={selectedGym?.id === gym.id ? colors.surface : colors.primary}
                />
              </LinearGradient>
              <View style={styles.markerShadow} />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={centerOnUserLocation} activeOpacity={0.8}>
          <LinearGradient colors={colors.gradient.primary} style={styles.fabGradient}>
            <Ionicons name="locate" size={24} color={colors.surface} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.fab} onPress={loadGymsAndLocation} activeOpacity={0.8}>
          <LinearGradient colors={colors.gradient.secondary} style={styles.fabGradient}>
            <Ionicons name="refresh" size={24} color={colors.surface} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {selectedGym && (
        <View style={styles.gymInfoContainer}>
          <BlurView intensity={20} style={styles.gymInfoBlur}>
            <View style={styles.gymInfoCard}>
              <View style={styles.gymInfoHeader}>
                <View style={styles.gymInfoContent}>
                  <Text style={styles.gymInfoName}>{selectedGym.name}</Text>
                  <View style={styles.gymInfoAddress}>
                    <Ionicons name="location-outline" size={14} color={colors.onSurfaceLight} />
                    <Text style={styles.addressText}>{selectedGym.address}</Text>
                  </View>
                  <View style={styles.gymInfoDistance}>
                    <LinearGradient colors={colors.gradient.primary} style={styles.distanceIcon}>
                      <Ionicons name="navigate" size={12} color={colors.surface} />
                    </LinearGradient>
                    <Text style={styles.distanceText}>{formatDistance(selectedGym.distance)}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedGym(null)} activeOpacity={0.8}>
                  <View style={styles.closeButtonBg}>
                    <Ionicons name="close" size={16} color={colors.onSurfaceVariant} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.gymInfoActions}>
                <TouchableOpacity style={styles.detailButton} onPress={navigateToGymDetail} activeOpacity={0.8}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.onSurface} />
                  <Text style={styles.detailButtonText}>Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedGym.latitude},${selectedGym.longitude}`
                    Linking.openURL(url)
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={colors.gradient.primary} style={styles.directionsButtonGradient}>
                    <Ionicons name="navigate" size={18} color={colors.surface} />
                    <Text style={styles.directionsButtonText}>Directions</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      )}

      <View style={styles.countIndicator}>
        <BlurView intensity={20} style={styles.countBlur}>
          <View style={styles.countContent}>
            <LinearGradient colors={colors.gradient.primary} style={styles.countIcon}>
              <Ionicons name="fitness" size={16} color={colors.surface} />
            </LinearGradient>
            <Text style={styles.countText}>
              {gyms.length} gym{gyms.length > 1 ? "s" : ""} found
            </Text>
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header moderne
  modernHeader: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    marginRight: 16,
  },
  backButtonBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.surface,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.primaryUltraLight,
    fontWeight: "500",
    marginTop: 2,
  },
  listButton: {
    marginLeft: 16,
  },
  listButtonBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.onSurface,
  },

  map: {
    flex: 1,
  },

  // Marqueurs
  markerContainer: {
    alignItems: "center",
    position: "relative",
  },
  marker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.surface,
  },
  selectedMarker: {
    transform: [{ scale: 1.2 }],
  },
  markerShadow: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.shadowDark,
    top: 2,
    zIndex: -1,
  },

  // FABs
  fabContainer: {
    position: "absolute",
    right: 20,
    bottom: 140,
    gap: 16,
  },
  fab: {
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },

  // Carte d'information
  gymInfoContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  gymInfoBlur: {
    borderRadius: 24,
    overflow: "hidden",
  },
  gymInfoCard: {
    padding: 24,
  },
  gymInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  gymInfoContent: {
    flex: 1,
    marginRight: 16,
  },
  gymInfoName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  gymInfoAddress: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
    marginLeft: 6,
    flex: 1,
  },
  gymInfoDistance: {
    flexDirection: "row",
    alignItems: "center",
  },
  distanceIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  distanceText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  gymInfoActions: {
    flexDirection: "row",
    gap: 12,
  },
  detailButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceVariant,
    borderRadius: 16,
    paddingVertical: 12,
    gap: 8,
  },
  detailButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onSurface,
  },
  directionsButton: {
    flex: 2,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  directionsButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  directionsButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },

  // Indicateur de comptage
  countIndicator: {
    position: "absolute",
    top: 100,
    left: 20,
  },
  countBlur: {
    borderRadius: 20,
    overflow: "hidden",
  },
  countContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  countIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: "700",
  },
})

export default MapScreen
