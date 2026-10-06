"use client"

import { useState, useCallback, useMemo } from "react"
import { ThemedText } from "@/components/ThemedText"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  StatusBar,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { router } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"

const { width, height } = Dimensions.get("window")

const API_BASE_URL = "http://192.168.7.5:5000/api"

const GymMapScreen = () => router.push("/GymListScreen")
// Palette de couleurs moderne et contrastée
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

// Fonction pour capitaliser la première lettre
const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Fonction pour capitaliser chaque mot
const capitalizeWords = (str: string): string => {
  return str.split(' ').map(word => capitalizeFirst(word)).join(' ')
}

// Configuration des objectifs avec couleurs plus visibles
const objectifs = [
  { 
    id: "all", 
    label: "All", 
    icon: "grid-outline",
    gradient: ["#263238", "#37474F"] as const,
    color: "#263238"
  },
  { 
    id: "muscle_gain", 
    label: "Muscle Gain", 
    icon: "barbell-outline",
    gradient: ["#D84315", "#FF5722"] as const,
    color: "#D84315"
  },
  { 
    id: "weight_loss", 
    label: "Weight Loss", 
    icon: "flame-outline",
    gradient: ["#FF5722", "#FF7043"] as const,
    color: "#FF5722"
  },
  { 
    id: "toning", 
    label: "Toning", 
    icon: "fitness-outline",
    gradient: ["#FF7043", "#FF9800"] as const,
    color: "#FF7043"
  },
]

// Utilitaires pour les objectifs
const getObjectifConfig = (objectif: string) => {
  const config = objectifs.find(obj => 
    obj.id === objectif.toLowerCase().replace(" ", "_") || 
    obj.label.toLowerCase() === objectif.toLowerCase()
  )
  return config || objectifs[0]
}

const getImageForObjectif = (objectif: string) => {
  switch (objectif.toLowerCase()) {
    case "muscle gain":
      return require("../../assets/images/prisedemassee.jpg")
    case "weight loss":
      return require("../../assets/images/pertedepoids.jpg")
    case "toning":
      return require("../../assets/images/tonification.jpg")
    default:
      return require("../../assets/images/tonification.jpg")
  }
}

// Interfaces
interface Exercice {
  _id: string
  nom: string
  instructions: string
  repetitions: string
}

interface Seance {
  _id: string
  date: string
  status: string
  exercices: Exercice[]
}

interface Programme {
  _id: string
  objectif: string
  niveau: string
  materiel: string[]
  createdAt: string
  actif: boolean
  seance?: Seance
}

// Composant de chargement minimaliste
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingContent}>
      <LinearGradient colors={colors.gradient.primary} style={styles.loadingIcon}>
        <ActivityIndicator size="large" color={colors.surface} />
      </LinearGradient>
      <Text style={styles.loadingText}>Loading workouts</Text>
    </View>
  </View>
)

// Header moderne et chic
const ModernHeader = ({ 
  searchText, 
  setSearchText, 
  onAddPress 
}: {
  searchText: string
  setSearchText: (text: string) => void
  onAddPress: () => void
}) => (
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
          <Text style={styles.modernGreeting}>Get Ready</Text>
        </View>
        <Text style={styles.modernSubtitle}>Choose your perfect workout program</Text>
        <TouchableOpacity onPress={GymMapScreen} style={styles.linkContainer}>
          <ThemedText style={styles.linkText}>Find the perfect gym near you</ThemedText>
        </TouchableOpacity>
      </View>
      
      
      <TouchableOpacity
        style={styles.modernAddButton}
        onPress={onAddPress}
        activeOpacity={0.8}
      >
        <LinearGradient colors={colors.gradient.primary} style={styles.addButtonGradient}>
          <Ionicons name="add" size={22} color={colors.surface} />
        </LinearGradient>
        <View style={styles.buttonGlow} />
      </TouchableOpacity>
    </View>

    {/* Barre de recherche moderne */}
    <View style={styles.searchContainer}>
      <BlurView intensity={10} style={styles.searchBlur}>
        <View style={styles.searchContent}>
          <LinearGradient colors={colors.gradient.primary} style={styles.searchIconContainer}>
            <Ionicons name="search" size={18} color={colors.surface} />
          </LinearGradient>
          <TextInput
            style={styles.modernSearchInput}
            placeholder="Search your ideal workout..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={colors.onSurfaceLight}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")} style={styles.clearButton}>
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

// Tag de catégorie avec meilleur contraste
const CategoryTag = ({
  objectif,
  selected,
  onPress,
}: {
  objectif: typeof objectifs[0]
  selected: boolean
  onPress: () => void
}) => (
  <TouchableOpacity
    style={[styles.categoryTag, selected && styles.categoryTagSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {selected ? (
      <LinearGradient colors={objectif.gradient} style={styles.selectedTag}>
        <Ionicons name={objectif.icon as any} size={16} color={colors.surface} />
        <Text style={styles.selectedTagText}>{objectif.label}</Text>
      </LinearGradient>
    ) : (
      <View style={styles.unselectedTag}>
        <Ionicons name={objectif.icon as any} size={16} color={objectif.color} />
        <Text style={[styles.unselectedTagText, { color: objectif.color }]}>{objectif.label}</Text>
      </View>
    )}
  </TouchableOpacity>
)

// Carte de programme épurée avec gestion du statut
const ProgramCard = ({ 
  programme, 
  index, 
  onStatusChange 
}: { 
  programme: Programme; 
  index: number;
  onStatusChange: (id: string, active: boolean) => void;
}) => {
  const objectifConfig = getObjectifConfig(programme.objectif)
  
  const handleStartWorkout = () => {
    // Marquer comme actif quand on démarre
    onStatusChange(programme._id, true)
    router.push(`/start-training?programmeId=${programme._id}`)
  }
  
  return (
    <View style={[styles.programCard, { marginTop: index === 0 ? 0 : 20 }]}>
      {/* Image avec overlay */}
      <View style={styles.imageContainer}>
        <Image 
          source={getImageForObjectif(programme.objectif)} 
          style={styles.cardImage} 
          resizeMode="cover" 
        />
        <LinearGradient
          colors={["transparent", "rgba(33, 33, 33, 0.8)"]}
          style={styles.imageOverlay}
        />
        
        {/* Badge objectif avec capitalisation */}
        <View style={styles.objectifBadge}>
          <LinearGradient colors={objectifConfig.gradient} style={styles.badgeContent}>
            <Ionicons name={objectifConfig.icon as any} size={14} color={colors.surface} />
            <Text style={styles.badgeText}>{capitalizeWords(programme.objectif)}</Text>
          </LinearGradient>
        </View>

        {/* Statut avec texte */}
        <View style={styles.statusContainer}>
          <BlurView intensity={20} style={styles.statusBlur}>
            <View style={styles.statusContent}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: programme.actif ? colors.success : colors.onSurfaceLight }
              ]} />
              <Text style={[
                styles.statusText,
                { color: programme.actif ? colors.success : colors.onSurfaceLight }
              ]}>
                {programme.actif ? "Active" : "Inactive"}
              </Text>
            </View>
          </BlurView>
        </View>
      </View>

      {/* Contenu */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{capitalizeWords(programme.niveau)} Level</Text>
          <Text style={styles.cardDate}>
            {new Date(programme.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>

        <View style={styles.equipmentSection}>
          <View style={styles.equipmentHeader}>
            <LinearGradient colors={colors.gradient.primary} style={styles.equipmentIcon}>
              <Ionicons name="barbell-outline" size={16} color={colors.surface} />
            </LinearGradient>
            <Text style={styles.equipmentLabel}>Equipment</Text>
          </View>
          <Text style={styles.equipmentText}>
            {programme.materiel.length > 0 
              ? programme.materiel.map(item => capitalizeWords(item)).join(", ") 
              : "No equipment needed"
            }
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => router.push(`/training-detail?programmeId=${programme._id}`)}
            activeOpacity={0.8}
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.onSurface} />
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartWorkout}
            activeOpacity={0.8}
          >
            <LinearGradient colors={colors.gradient.primary} style={styles.startButtonGradient}>
              <Ionicons name="play" size={16} color={colors.surface} />
              <Text style={styles.startButtonText}>Start Workout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

// État vide minimaliste
const EmptyState = ({ onCreatePress }: { onCreatePress: () => void }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <LinearGradient colors={colors.gradient.secondary} style={styles.emptyIcon}>
        <Ionicons name="fitness-outline" size={52} color={colors.surface} />
      </LinearGradient>
    </View>
    <Text style={styles.emptyTitle}>No workouts found</Text>
    <Text style={styles.emptySubtitle}>Create your first training program to get started</Text>
    <TouchableOpacity style={styles.createButton} onPress={onCreatePress} activeOpacity={0.8}>
      <LinearGradient colors={colors.gradient.primary} style={styles.createButtonGradient}>
        <Ionicons name="add-circle-outline" size={20} color={colors.surface} />
        <Text style={styles.createButtonText}>Create Program</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
)

// Composant principal
export default function TrainingsScreen() {
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [selectedObjectif, setSelectedObjectif] = useState("all")
  const insets = useSafeAreaInsets()

  // Fonction pour changer le statut d'un programme
  const handleStatusChange = useCallback((programmeId: string, active: boolean) => {
    setProgrammes(prev => 
      prev.map(programme => 
        programme._id === programmeId 
          ? { ...programme, actif: active }
          : programme
      )
    )
  }, [])

  useFocusEffect(
    useCallback(() => {
      const fetchProgrammes = async () => {
        try {
          const token = await AsyncStorage.getItem("authToken")
          const response = await fetch(`${API_BASE_URL}/programme`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
          const data = await response.json()
          if (!response.ok) throw new Error(data.message || "Failed to load")
          setProgrammes(data)
        } catch (error) {
          console.error("Error loading programmes:", error)
        } finally {
          setLoading(false)
        }
      }
      fetchProgrammes()
    }, [])
  )

  const filteredProgrammes = useMemo(() => {
    return programmes.filter((item) => {
      const query = searchText.toLowerCase()
      const matchSearch =
        item.objectif.toLowerCase().includes(query) ||
        item.niveau.toLowerCase().includes(query) ||
        item.materiel.some((mat) => mat.toLowerCase().includes(query))
      
      const matchObjectif = selectedObjectif === "all" || 
        item.objectif.toLowerCase().replace(" ", "_") === selectedObjectif ||
        item.objectif.toLowerCase() === selectedObjectif.replace("_", " ")
      
      return matchSearch && matchObjectif
    })
  }, [programmes, searchText, selectedObjectif])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
      >
        {/* Header moderne */}
        <ModernHeader
          searchText={searchText}
          setSearchText={setSearchText}
          onAddPress={() => router.push("/add-programme")}
        />

        {/* Catégories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {objectifs.map((objectif) => (
              <CategoryTag
                key={objectif.id}
                objectif={objectif}
                selected={selectedObjectif === objectif.id}
                onPress={() => setSelectedObjectif(objectif.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Programmes */}
        <View style={styles.programsSection}>
          <View style={styles.programsHeader}>
            <Text style={styles.sectionTitle}>Your Programs</Text>
            <View style={styles.counter}>
              <Text style={styles.counterText}>{filteredProgrammes.length}</Text>
            </View>
          </View>

          {filteredProgrammes.length === 0 ? (
            <EmptyState onCreatePress={() => router.push("/add-programme")} />
          ) : (
            <View style={styles.programsList}>
              {filteredProgrammes.map((programme, index) => (
                <ProgramCard 
                  key={programme._id} 
                  programme={programme} 
                  index={index}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

// Styles épurés et modernes avec police plus claire
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
  programsSection: {
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

  // Programmes
  programsHeader: {
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
  programsList: {
    gap: 20,
  },

  // Carte de programme
  programCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.surface,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  imageContainer: {
    height: 180,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  objectifBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
  statusContainer: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  statusBlur: {
    borderRadius: 16,
    overflow: "hidden",
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  cardContent: {
    padding: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  cardDate: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
  },
  equipmentSection: {
    marginBottom: 20,
  },
  equipmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  equipmentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  equipmentLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.onSurface,
  },
  equipmentText: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
    lineHeight: 22,
    marginLeft: 44,
  },
  cardActions: {
    flexDirection: "row",
    gap: 16,
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
  startButton: {
    flex: 2,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
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
  createButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 16,
    gap: 10,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.surface,
  },
   linkContainer: {
    marginTop: 20,
    alignItems: "center",
    marginRight:30
  },
  linkText: {
    color: "#FF6B35",
    fontSize: 16,
  },
})