"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
  Dimensions,
  StatusBar,
  ScrollView,
} from "react-native"
import { ActivityIndicator } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { router } from "expo-router"
import type { Gym, Location } from "@/types/gym"
import { gymService } from "@/services/api"
import { LocationService } from "@/services/locationService"

const { width, height } = Dimensions.get("window")

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

interface GymListScreenProps {
  navigate?: (screenName: string, params?: any) => void
}

const GymListScreen: React.FC<GymListScreenProps> = ({ navigate }) => {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [filteredGyms, setFilteredGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [selectedDistance, setSelectedDistance] = useState<number>(5)

  const distanceOptions = [1, 2, 5, 10, 20]

  useEffect(() => {
    loadGyms()
  }, [])

  useEffect(() => {
    filterGyms()
  }, [searchQuery, gyms, selectedDistance])

  const loadGyms = async (): Promise<void> => {
    try {
      setLoading(true)

      const location = await LocationService.getCurrentLocation()
      setUserLocation(location)

      const gymsData = await gymService.searchNearbyGyms(location.latitude, location.longitude, selectedDistance * 1000)

      setGyms(gymsData)
    } catch (error) {
      console.error("Erreur lors du chargement des salles de sport:", error)
      Alert.alert(
        "Erreur",
        "Impossible de charger les salles de sport. Vérifiez votre connexion et les permissions de localisation.",
      )
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true)
    await loadGyms()
    setRefreshing(false)
  }

  const filterGyms = (): void => {
    let filtered = gyms

    if (userLocation) {
      filtered = filtered.filter((gym) => (gym.distance ?? 0) <= selectedDistance * 1000)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (gym) => gym.name.toLowerCase().includes(query) || gym.address.toLowerCase().includes(query),
      )
    }

    setFilteredGyms(filtered)
  }

  const openDirections = (gym: Gym): void => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${gym.latitude},${gym.longitude}`
    Linking.openURL(url)
  }

  const callGym = (phone: string): void => {
    Linking.openURL(`tel:${phone}`)
  }

  const formatDistance = (distance: number | undefined): string => {
    if (!distance) return "Distance inconnue"
    if (distance < 1000) {
      return `${Math.round(distance)}m`
    }
    return `${(distance / 1000).toFixed(1)}km`
  }

  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <LinearGradient colors={colors.gradient.primary} style={styles.loadingIcon}>
          <ActivityIndicator size="large" color={colors.surface} />
        </LinearGradient>
        <Text style={styles.loadingText}>Finding perfect gyms</Text>
      </View>
    </View>
  )

  const ModernHeader = () => (
    <View style={styles.modernHeader}>
      <View style={styles.headerContent}>
        <View style={styles.welcomeSection}>
          <View style={styles.greetingContainer}>
            <LinearGradient
              colors={colors.gradient.primary}
              style={styles.greetingAccent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={styles.modernGreeting}>Find Gyms</Text>
          </View>
          <Text style={styles.modernSubtitle}>Discover the perfect gym near you</Text>
        </View>

        <TouchableOpacity
          style={styles.modernAddButton}
          onPress={() => router.push("/GymMapScreen")}
          activeOpacity={0.8}
        >
          <LinearGradient colors={colors.gradient.primary} style={styles.addButtonGradient}>
            <Ionicons name="map" size={22} color={colors.surface} />
          </LinearGradient>
          <View style={styles.buttonGlow} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <BlurView intensity={10} style={styles.searchBlur}>
          <View style={styles.searchContent}>
            <LinearGradient colors={colors.gradient.primary} style={styles.searchIconContainer}>
              <Ionicons name="search" size={18} color={colors.surface} />
            </LinearGradient>
            <TextInput
              style={styles.modernSearchInput}
              placeholder="Search your perfect gym..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.onSurfaceLight}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                <View style={styles.clearButtonBg}>
                  <Ionicons name="close" size={16} color={colors.onSurfaceVariant} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </BlurView>
      </View>
    </View>
  )

  const DistanceTag = ({
    distance,
    selected,
    onPress,
  }: {
    distance: number
    selected: boolean
    onPress: () => void
  }) => (
    <TouchableOpacity
      style={[styles.categoryTag, selected && styles.categoryTagSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {selected ? (
        <LinearGradient colors={colors.gradient.primary} style={styles.selectedTag}>
          <Ionicons name="location" size={16} color={colors.surface} />
          <Text style={styles.selectedTagText}>{distance}km</Text>
        </LinearGradient>
      ) : (
        <View style={styles.unselectedTag}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text style={[styles.unselectedTagText, { color: colors.primary }]}>{distance}km</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  const renderGymItem = ({ item, index }: { item: Gym; index: number }) => (
    <View style={[styles.gymCard, { marginTop: index === 0 ? 0 : 20 }]}>
      <View style={styles.cardHeader}>
        <LinearGradient
          colors={["rgba(249, 115, 22, 0.1)", "rgba(249, 115, 22, 0.05)"]}
          style={styles.cardHeaderGradient}
        />
        <View style={styles.gymInfo}>
          <Text style={styles.gymName}>{item.name}</Text>
          <View style={styles.addressContainer}>
            <LinearGradient colors={colors.gradient.primary} style={styles.addressIcon}>
              <Ionicons name="location" size={14} color={colors.surface} />
            </LinearGradient>
            <Text style={styles.gymAddress}>{item.address}</Text>
          </View>
        </View>

        <View style={styles.distanceContainer}>
          <BlurView intensity={20} style={styles.distanceBlur}>
            <View style={styles.distanceContent}>
              <View style={styles.distanceDot} />
              <Text style={styles.distance}>{formatDistance(item.distance)}</Text>
            </View>
          </BlurView>
        </View>
      </View>

      <View style={styles.cardContent}>
        {item.opening_hours && (
          <View style={styles.hoursSection}>
            <View style={styles.hoursHeader}>
              <LinearGradient colors={colors.gradient.primary} style={styles.hoursIcon}>
                <Ionicons name="time-outline" size={16} color={colors.surface} />
              </LinearGradient>
              <Text style={styles.hoursLabel}>Opening Hours</Text>
            </View>
            <Text style={styles.hoursText}>{item.opening_hours}</Text>
          </View>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => router.push(`/GymDetailScreen?gymId=${item.id}`)}
            activeOpacity={0.8}
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.onSurface} />
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.directionsButton} onPress={() => openDirections(item)} activeOpacity={0.8}>
            <LinearGradient colors={colors.gradient.primary} style={styles.directionsButtonGradient}>
              <Ionicons name="navigate" size={16} color={colors.surface} />
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          {item.phone && (
            <TouchableOpacity style={styles.quickActionButton} onPress={() => callGym(item.phone!)} activeOpacity={0.8}>
              <LinearGradient colors={colors.gradient.accent} style={styles.quickActionGradient}>
                <Ionicons name="call" size={18} color={colors.primary} />
                <Text style={styles.quickActionText}>Call</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.quickActionButton} onPress={() => openDirections(item)} activeOpacity={0.8}>
            <LinearGradient colors={colors.gradient.primary} style={styles.quickActionGradient}>
              <Ionicons name="car" size={18} color={colors.surface} />
              <Text style={[styles.quickActionText, { color: colors.surface }]}>Navigate</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient colors={colors.gradient.secondary} style={styles.emptyIcon}>
          <Ionicons name="fitness-outline" size={52} color={colors.surface} />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>No gyms found</Text>
      <Text style={styles.emptySubtitle}>Try adjusting your search distance or refresh to find gyms near you</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadGyms} activeOpacity={0.8}>
        <LinearGradient colors={colors.gradient.primary} style={styles.retryButtonGradient}>
          <Ionicons name="refresh-circle-outline" size={20} color={colors.surface} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ModernHeader />

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Distance</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {distanceOptions.map((distance) => (
              <DistanceTag
                key={distance}
                distance={distance}
                selected={selectedDistance === distance}
                onPress={() => setSelectedDistance(distance)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.gymsSection}>
          <View style={styles.gymsHeader}>
            <Text style={styles.sectionTitle}>Nearby Gyms</Text>
            <View style={styles.counter}>
              <Text style={styles.counterText}>{filteredGyms.length}</Text>
            </View>
          </View>

          {filteredGyms.length === 0 ? (
            <EmptyState />
          ) : (
            <View style={styles.gymsList}>
              {filteredGyms.map((gym, index) => (
                <View key={gym.id}>{renderGymItem({ item: gym, index })}</View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  // Layout principal
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
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

  // Header moderne
  modernHeader: {
    marginBottom: 36,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  welcomeSection: {
    flex: 1,
  },
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  greetingAccent: {
    width: 4,
    height: 28,
    borderRadius: 2,
    marginRight: 12,
  },
  modernGreeting: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -1,
  },
  modernSubtitle: {
    fontSize: 18,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
    lineHeight: 24,
    marginLeft: 16,
  },
  modernAddButton: {
    position: "relative",
    marginLeft: 20,
  },
  addButtonGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonGlow: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.shadow,
    top: 2,
    left: 0,
    zIndex: -1,
  },

  // Barre de recherche moderne
  searchContainer: {
    marginHorizontal: 2,
  },
  searchBlur: {
    borderRadius: 24,
    overflow: "hidden",
  },
  searchContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  modernSearchInput: {
    flex: 1,
    fontSize: 17,
    color: colors.onSurface,
    fontWeight: "500",
  },
  clearButton: {
    padding: 6,
  },
  clearButtonBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },

  // Sections
  categoriesSection: {
    marginBottom: 36,
  },
  gymsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: 20,
    letterSpacing: -0.5,
  },

  // Catégories
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryTag: {
    marginRight: 14,
    borderRadius: 24,
    overflow: "hidden",
  },
  categoryTagSelected: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  selectedTagText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },
  unselectedTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    gap: 8,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  unselectedTagText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Gyms
  gymsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  counter: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  counterText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  gymsList: {
    gap: 20,
  },

  // Carte de gym
  gymCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.surface,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    position: "relative",
    padding: 24,
    paddingBottom: 16,
  },
  cardHeaderGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gymInfo: {
    flex: 1,
    marginRight: 16,
  },
  gymName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  gymAddress: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
    flex: 1,
  },
  distanceContainer: {
    position: "absolute",
    top: 24,
    right: 24,
  },
  distanceBlur: {
    borderRadius: 16,
    overflow: "hidden",
  },
  distanceContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  distanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  distance: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.success,
  },
  cardContent: {
    padding: 24,
    paddingTop: 8,
  },
  hoursSection: {
    marginBottom: 20,
  },
  hoursHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  hoursIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  hoursLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.onSurface,
  },
  hoursText: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
    lineHeight: 22,
    marginLeft: 44,
  },
  cardActions: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  detailsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceVariant,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
  },
  detailsButtonText: {
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
    paddingVertical: 14,
    gap: 8,
  },
  directionsButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  quickActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // État vide
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 17,
    color: colors.onSurfaceVariant,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 24,
  },
  retryButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 16,
    gap: 10,
  },
  retryButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.surface,
  },
})

export default GymListScreen
