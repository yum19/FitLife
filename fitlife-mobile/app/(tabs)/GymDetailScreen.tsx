"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { router, useLocalSearchParams } from "expo-router"
import { ActivityIndicator } from "react-native-paper"
import type { Gym } from "@/types/gym"
import { gymService } from "@/services/api"

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

interface GymDetailScreenProps {
  gym?: Gym | null
  goBack?: () => void
  navigate?: (screenName: string, params?: any) => void
}

const GymDetailScreen: React.FC<GymDetailScreenProps> = ({ gym: propGym, goBack, navigate }) => {
  const [gym, setGym] = useState<Gym | null>(propGym || null)
  const [loading, setLoading] = useState<boolean>(!propGym)
  const { gymId } = useLocalSearchParams<{ gymId: string }>()

  useEffect(() => {
    const fetchGymData = async () => {
      if (!propGym && gymId) {
        try {
          setLoading(true)
          const gymData = await gymService.getGymDetails(gymId)
          setGym(gymData)
        } catch (error) {
          console.error("Error fetching gym details:", error)
          Alert.alert("Error", "Unable to load gym details")
        } finally {
          setLoading(false)
        }
      }
    }

    fetchGymData()
  }, [gymId, propGym])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LinearGradient colors={colors.gradient.primary} style={styles.loadingIcon}>
            <ActivityIndicator size="large" color={colors.surface} />
          </LinearGradient>
          <Text style={styles.loadingText}>Loading gym details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!gym) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <LinearGradient colors={colors.gradient.primary} style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={48} color={colors.surface} />
          </LinearGradient>
          <Text style={styles.errorTitle}>No Gym Selected</Text>
          <Text style={styles.errorSubtitle}>Please select a gym to view details</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()} activeOpacity={0.8}>
            <LinearGradient colors={colors.gradient.primary} style={styles.retryButtonGradient}>
              <Text style={styles.retryButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const openDirections = (): void => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${gym.latitude},${gym.longitude}`
    Linking.openURL(url)
  }

  const callGym = (): void => {
    if (gym.phone) {
      Linking.openURL(`tel:${gym.phone}`)
    }
  }

  const openWebsite = (): void => {
    if (gym.website) {
      Linking.openURL(gym.website)
    }
  }

  const formatDistance = (distance: number | undefined): string => {
    if (!distance) return "Distance unknown"
    if (distance < 1000) {
      return `${Math.round(distance)} meters`
    }
    return `${(distance / 1000).toFixed(1)} kilometers`
  }

  const shareGym = (): void => {
    const message = `Check out this gym: ${gym.name}\n${gym.address}\nhttps://www.google.com/maps/search/?api=1&query=${gym.latitude},${gym.longitude}`
    Alert.alert("Share Gym", message)
  }

  const getEquipmentIcon = (equipment: string): string => {
    const equipmentIcons: { [key: string]: string } = {
      cardio: "fitness-outline",
      musculation: "barbell-outline",
      piscine: "water-outline",
      sauna: "thermometer-outline",
      cours: "people-outline",
      parking: "car-outline",
    }
    return equipmentIcons[equipment.toLowerCase()] || "checkmark-circle-outline"
  }

  const ModernHeader = () => (
    <LinearGradient colors={colors.gradient.primary} style={styles.modernHeader}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/GymListScreen")} activeOpacity={0.8}>
          <View style={styles.backButtonBg}>
            <Ionicons name="arrow-back" size={24} color={colors.surface} />
          </View>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Gym Details</Text>
          <Text style={styles.headerSubtitle}>Complete information</Text>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={shareGym} activeOpacity={0.8}>
          <View style={styles.shareButtonBg}>
            <Ionicons name="share" size={20} color={colors.surface} />
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <View style={styles.gymHeader}>
            <View style={styles.gymInfo}>
              <Text style={styles.gymName}>{gym.name}</Text>
              <View style={styles.addressContainer}>
                <LinearGradient colors={colors.gradient.primary} style={styles.addressIcon}>
                  <Ionicons name="location" size={16} color={colors.surface} />
                </LinearGradient>
                <Text style={styles.address}>{gym.address}</Text>
              </View>
              <View style={styles.distanceContainer}>
                <LinearGradient colors={colors.gradient.accent} style={styles.distanceIcon}>
                  <Ionicons name="navigate" size={16} color={colors.primary} />
                </LinearGradient>
                <Text style={styles.distance}>{formatDistance(gym.distance)}</Text>
              </View>
            </View>

            {gym.rating && (
              <View style={styles.ratingContainer}>
                <LinearGradient colors={colors.gradient.primary} style={styles.ratingBadge}>
                  <Ionicons name="star" size={16} color={colors.surface} />
                  <Text style={styles.ratingText}>{gym.rating}</Text>
                </LinearGradient>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionItem} onPress={openDirections} activeOpacity={0.8}>
              <LinearGradient colors={colors.gradient.primary} style={styles.actionIcon}>
                <Ionicons name="navigate" size={24} color={colors.surface} />
              </LinearGradient>
              <Text style={styles.actionText}>Directions</Text>
            </TouchableOpacity>

            {gym.phone && (
              <TouchableOpacity style={styles.actionItem} onPress={callGym} activeOpacity={0.8}>
                <LinearGradient colors={colors.gradient.accent} style={styles.actionIcon}>
                  <Ionicons name="call" size={24} color={colors.primary} />
                </LinearGradient>
                <Text style={styles.actionText}>Call</Text>
              </TouchableOpacity>
            )}

            {gym.website && (
              <TouchableOpacity style={styles.actionItem} onPress={openWebsite} activeOpacity={0.8}>
                <LinearGradient colors={colors.gradient.secondary} style={styles.actionIcon}>
                  <Ionicons name="globe" size={24} color={colors.surface} />
                </LinearGradient>
                <Text style={styles.actionText}>Website</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionItem} onPress={shareGym} activeOpacity={0.8}>
              <LinearGradient colors={colors.gradient.cool} style={styles.actionIcon}>
                <Ionicons name="share" size={24} color={colors.onSurface} />
              </LinearGradient>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            {gym.phone && (
              <TouchableOpacity style={styles.infoRow} onPress={callGym} activeOpacity={0.8}>
                <LinearGradient colors={colors.gradient.primary} style={styles.infoIcon}>
                  <Ionicons name="call" size={20} color={colors.surface} />
                </LinearGradient>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{gym.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceLight} />
              </TouchableOpacity>
            )}

            {gym.website && (
              <TouchableOpacity style={styles.infoRow} onPress={openWebsite} activeOpacity={0.8}>
                <LinearGradient colors={colors.gradient.secondary} style={styles.infoIcon}>
                  <Ionicons name="globe" size={20} color={colors.surface} />
                </LinearGradient>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Website</Text>
                  <Text style={styles.infoValue}>Visit website</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceLight} />
              </TouchableOpacity>
            )}

            <View style={styles.infoRow}>
              <LinearGradient colors={colors.gradient.accent} style={styles.infoIcon}>
                <Ionicons name="location" size={20} color={colors.primary} />
              </LinearGradient>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{gym.address}</Text>
              </View>
            </View>
          </View>
        </View>

        {gym.opening_hours && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Opening Hours</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <LinearGradient colors={colors.gradient.primary} style={styles.infoIcon}>
                  <Ionicons name="time" size={20} color={colors.surface} />
                </LinearGradient>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Schedule</Text>
                  <Text style={styles.infoValue}>{gym.opening_hours}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {gym.amenities && gym.amenities.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Available Equipment</Text>
            <View style={styles.amenitiesContainer}>
              {gym.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <LinearGradient colors={colors.gradient.primary} style={styles.amenityIcon}>
                    <Ionicons name={getEquipmentIcon(amenity) as any} size={20} color={colors.surface} />
                  </LinearGradient>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.mainActionContainer}>
          <TouchableOpacity style={styles.mainActionButton} onPress={openDirections} activeOpacity={0.8}>
            <LinearGradient colors={colors.gradient.primary} style={styles.mainActionGradient}>
              <Ionicons name="navigate" size={24} color={colors.surface} />
              <Text style={styles.mainActionText}>Get Directions</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

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
  shareButton: {
    marginLeft: 16,
  },
  shareButtonBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  errorSubtitle: {
    fontSize: 17,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  retryButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },

  scrollView: {
    flex: 1,
  },

  mainCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  gymHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  gymInfo: {
    flex: 1,
    marginRight: 16,
  },
  gymName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  address: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
    flex: 1,
    lineHeight: 22,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  distanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  distance: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "700",
  },
  ratingContainer: {
    alignItems: "center",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },

  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: 20,
    letterSpacing: -0.3,
  },

  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionItem: {
    alignItems: "center",
    flex: 1,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    fontSize: 14,
    color: colors.onSurface,
    fontWeight: "600",
    textAlign: "center",
  },

  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.onSurfaceLight,
    fontWeight: "500",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: colors.onSurface,
    fontWeight: "600",
  },

  amenitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  amenityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  amenityText: {
    fontSize: 16,
    color: colors.onSurface,
    fontWeight: "600",
  },

  mainActionContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  mainActionButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  mainActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  mainActionText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
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
})

export default GymDetailScreen
