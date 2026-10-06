"use client"
import React from "react"
import { useLocalSearchParams, router } from "expo-router"
import { useState, useCallback, useRef } from "react"
import { useFocusEffect } from "@react-navigation/native"
import { MaterialIcons, FontAwesome5, Feather, MaterialCommunityIcons } from "@expo/vector-icons"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Switch,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  Easing,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"


const API_URL = "http://192.168.7.5:5000/api"

const { width, height } = Dimensions.get("window")

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// Palette de couleurs moderne et contrastée - IDENTIQUE à TrainingsScreen
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
    backgroundColor: "rgba(255, 255, 255, 0.2)" as const,
    backgroundColorDelete: "rgba(244, 67, 54, 0.8)" as const,
  },
}

// Fonction pour capitaliser la première lettre
const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Fonction pour capitaliser chaque mot
const capitalizeWords = (str: string): string => {
  return str
    .split(" ")
    .map((word) => capitalizeFirst(word))
    .join(" ")
}

interface Exercice {
  _id: string
  nom: string
  repetitions: string
  instructions: string
}

interface Seance {
  _id: string
  date: string
  status: string
  exercices: Exercice[]
}

interface Programme {
  _id: string
  nom: string
  objectif: string
  niveau: string
  materiel: string[]
  actif: boolean
  createdAt: string
  seances?: Seance[]
}

const getImageByGoal = (goal: string) => {
  if (!goal) return null
  const key = goal.toLowerCase()
  switch (key) {
    case "perte de poids":
    case "weight loss":
      return require("../../assets/images/pertedepoids.jpg")
    case "prise de masse":
    case "muscle gain":
      return require("../../assets/images/prisedemassee.jpg")
    case "tonification":
    case "toning":
    default:
      return require("../../assets/images/tonification.jpg")
  }
}

const getKeyForSeance = (seanceId: string) => `doneExercises_${seanceId}`

// Composant de chargement minimaliste - IDENTIQUE au style TrainingsScreen
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingContent}>
      <LinearGradient colors={colors.gradient.primary} style={styles.loadingIcon}>
        <ActivityIndicator size="large" color={colors.surface} />
      </LinearGradient>
      <Text style={styles.loadingText}>Loading program details</Text>
    </View>
  </View>
)

// Composant de progression circulaire élégant avec le style TrainingsScreen
const ElegantCircularProgress = ({ progress, size = 140 }: { progress: number; size?: number }) => {
  const animatedValue = useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 2000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [progress])

  return (
    <View style={[styles.elegantProgress, { width: size, height: size }]}>
      <View style={styles.progressInner}>
        <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
        <Text style={styles.progressSubtext}>Complete</Text>
      </View>
      {/* Progress ring background */}
      <View style={styles.progressRing}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </View>
  )
}

const TrainingDetailScreen = () => {
  const { programmeId } = useLocalSearchParams()
  const [programme, setProgramme] = useState<Programme | null>(null)
  const [loading, setLoading] = useState(true)
  const [doneMap, setDoneMap] = useState<{ [key: string]: string[] }>({})
  const [progressMap, setProgressMap] = useState<{ [key: string]: number }>({})
  const [expandedSeances, setExpandedSeances] = useState<{ [key: string]: boolean }>({})

  // Animations subtiles
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useFocusEffect(
    useCallback(() => {
      const fetchProgramme = async () => {
        try {
          setLoading(true)
          const token = await AsyncStorage.getItem("authToken")
          const response = await fetch(`${API_URL}/programme/${programmeId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!response.ok) throw new Error("Failed to fetch programme")
          const data = await response.json()
          setProgramme(data)

          // Load progress for each session
          const done: { [k: string]: string[] } = {}
          const prog: { [k: string]: number } = {}
          if (data.seances) {
            for (const s of data.seances) {
              const saved = await AsyncStorage.getItem(getKeyForSeance(s._id))
              const arr = saved ? JSON.parse(saved) : []
              done[s._id] = arr
              prog[s._id] = (arr.length / (s.exercices.length || 1)) * 100
            }
          }
          setDoneMap(done)
          setProgressMap(prog)

          // Animation douce
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 1000,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start()
        } catch (error) {
          Alert.alert("Error", "Unable to load program details.")
        } finally {
          setLoading(false)
        }
      }
      if (programmeId) fetchProgramme()
    }, [programmeId]),
  )

  const handleToggleExercise = async (seanceId: string, exId: string, value: boolean) => {
    let arr = doneMap[seanceId] || []
    arr = value ? [...arr, exId] : arr.filter((id) => id !== exId)
    setDoneMap({ ...doneMap, [seanceId]: arr })
    const session = programme?.seances?.find((s) => s._id === seanceId)
    const exerciseCount = session?.exercices.length || 1
    setProgressMap({
      ...progressMap,
      [seanceId]: (arr.length / exerciseCount) * 100,
    })
    await AsyncStorage.setItem(getKeyForSeance(seanceId), JSON.stringify(arr))
  }

  const handleMarkDone = async (seanceId: string) => {
    try {
      const token = await AsyncStorage.getItem("authToken")
      await fetch(`${API_URL}/seances/${seanceId}/terminer`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      await fetch(`${API_URL}/seances`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          seanceId,
          exercicesRealises: (doneMap[seanceId] || []).map((id) => ({
            exerciceId: id,
            series: 3,
            repetitions: 12,
            poids: 0,
          })),
          dureeReelle: 30,
          statut: "completed",
        }),
      })
      setProgramme((prev) =>
        prev && prev.seances
          ? {
              ...prev,
              seances: prev.seances.map((s) => (s._id === seanceId ? { ...s, status: "completed" } : s)),
            }
          : prev,
      )
      Alert.alert("🎉 Congrats!", "Session completed successfully!")
    } catch {
      Alert.alert("Error", "Unable to complete session.")
    }
  }

  const toggleSeance = (id: string) => {
    LayoutAnimation.configureNext({
      duration: 400,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    })
    setExpandedSeances({ ...expandedSeances, [id]: !expandedSeances[id] })
  }

  const handleDelete = async () => {
    Alert.alert("Confirm", "Do you want to delete this program?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("authToken")
            const res = await fetch(`${API_URL}/programme/${programmeId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            })
            const result = await res.json()
            if (res.ok) {
              Alert.alert("Deleted", result.message)
              router.replace("/trainings")
            } else {
              Alert.alert("Error", result.error || "Deletion failed.")
            }
          } catch (err) {
            Alert.alert("Error", "Server error.")
          }
        },
      },
    ])
  }

  const handleUpdate = () => {
    router.push(`/update-training?programmeId=${programmeId}`)
  }

  const handleChangeDate = (seanceId: string) => {
    router.push(`/update-session?seanceId=${seanceId}`)
  }

  // Calculer le progrès global
  const calculateOverallProgress = () => {
    if (!programme?.seances?.length) return 0
    const totalProgress = Object.values(progressMap).reduce((sum, progress) => sum + progress, 0)
    return totalProgress / programme.seances.length
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!programme) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.onSurfaceMuted} />
          <Text style={styles.errorTitle}>Program not found</Text>
          <Text style={styles.errorSubtitle}>Please try again or contact support</Text>
        </View>
      </View>
    )
  }

  const goalImage = getImageByGoal(programme.objectif)
  const overallProgress = calculateOverallProgress()

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Section héro élégante */}
        <View style={styles.heroSection}>
          {goalImage && <Image source={goalImage} style={styles.heroImage} resizeMode="cover" />}
          <LinearGradient colors={["transparent", "rgba(33, 33, 33, 0.8)"]} style={styles.imageOverlay} />

          {/* Actions d'en-tête subtiles */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.modernAddButton} onPress={handleUpdate} activeOpacity={0.8}>
              <LinearGradient   colors={[colors.gradient.backgroundColor, colors.gradient.backgroundColor]} style={styles.addButtonGradient}>
                <Feather name="edit-3" size={18} color={colors.surface} />
              </LinearGradient>
              <View style={styles.buttonGlow} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.modernAddButton} onPress={handleDelete} activeOpacity={0.8}>
              <LinearGradient colors={[colors.gradient.backgroundColorDelete, colors.gradient.backgroundColorDelete]} style={styles.addButtonGradient}>
                <Feather name="trash-2" size={18} color={colors.surface} />
              </LinearGradient>
              <View style={styles.buttonGlow} />
            </TouchableOpacity>
          </View>

          {/* Contenu héro élégant */}
          <Animated.View
            style={[
              styles.heroContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.heroSubtitle}>Your personalized fitness journey</Text>
            {/* Affichage de progression élégant */}
            <View style={styles.progressSection}>
              <ElegantCircularProgress progress={overallProgress} />
            </View>
          </Animated.View>
        </View>

        {/* Section de contenu élégant */}
        <Animated.View
          style={[
            styles.contentSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Grille de statistiques améliorée avec 4 cartes */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <LinearGradient colors={colors.gradient.primary} style={styles.statIcon}>
                  <Ionicons name="flag-outline" size={22} color={colors.surface} />
                </LinearGradient>
              </View>
              <Text style={styles.statLabel}>Goal</Text>
              <Text style={styles.statValue}>{capitalizeWords(programme.objectif)}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <LinearGradient colors={colors.gradient.primary} style={styles.statIcon}>
                  <Ionicons name="trending-up" size={22} color={colors.surface} />
                </LinearGradient>
              </View>
              <Text style={styles.statLabel}>Level</Text>
              <Text style={styles.statValue}>{capitalizeWords(programme.niveau)}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <LinearGradient colors={colors.gradient.primary} style={styles.statIcon}>
                  <Ionicons name="calendar-outline" size={20} color={colors.surface} />
                </LinearGradient>
              </View>
              <Text style={styles.statLabel}>Sessions</Text>
              <Text style={styles.statValue}>{programme.seances?.length || 0}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <LinearGradient colors={colors.gradient.primary} style={styles.statIcon}>
                  <Ionicons name="trophy-outline" size={22} color={colors.surface} />
                </LinearGradient>
              </View>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statValue}>
                {programme.seances?.filter((s) => s.status === "completed").length || 0}
              </Text>
            </View>
          </View>

          {/* Section équipement */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.equipmentHeader}>
                <LinearGradient colors={colors.gradient.primary} style={styles.equipmentIcon}>
                  <Ionicons name="barbell-outline" size={16} color={colors.surface} />
                </LinearGradient>
                <Text style={styles.equipmentLabel}>Equipment</Text>
              </View>
            </View>
            <Text style={styles.equipmentText}>
              {programme.materiel?.length > 0
                ? programme.materiel.map((item) => capitalizeWords(item)).join(", ")
                : "No equipment needed"}
            </Text>
          </View>

          {/* Sessions d'entraînement */}
          <View style={styles.programsSection}>
            <View style={styles.programsHeader}>
              <Text style={styles.sectionTitle}>Training Sessions</Text>
              <View style={styles.counter}>
                <Text style={styles.counterText}>{programme.seances?.length || 0}</Text>
              </View>
            </View>

            {programme.seances && programme.seances.length > 0 ? (
              <View style={styles.programsList}>
                {programme.seances.map((session: Seance, index: number) => {
                  const expanded = expandedSeances[session._id]
                  const sessionProgress = progressMap[session._id] || 0
                  const isCompleted = session.status === "completed"
                  const allExercisesCompleted = sessionProgress === 100

                  return (
                    <View key={session._id} style={styles.sessionCard}>
                      <TouchableOpacity
                        onPress={() => toggleSeance(session._id)}
                        style={styles.sessionHeader}
                        activeOpacity={0.8}
                      >
                        <View style={styles.sessionLeft}>
                          <View style={[styles.sessionNumber, isCompleted && styles.sessionNumberCompleted]}>
                            {isCompleted ? (
                              <Ionicons name="checkmark" size={14} color={colors.surface} />
                            ) : (
                              <Text style={styles.sessionNumberText}>{index + 1}</Text>
                            )}
                          </View>
                          <View style={styles.sessionInfo}>
                            <Text style={styles.sessionTitle}>Session {index + 1}</Text>
                            <Text style={styles.sessionDate}>
                              {new Date(session.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.sessionRight}>
                          <Text style={styles.sessionProgress}>{Math.round(sessionProgress)}%</Text>
                          <Ionicons
                            name={expanded ? "chevron-up" : "chevron-down"}
                            size={18}
                            color={colors.onSurfaceMuted}
                          />
                        </View>
                      </TouchableOpacity>

                      {/* Barre de progression subtile */}
                      <View style={styles.sessionProgressContainer}>
                        <View style={styles.sessionProgressBar}>
                          <LinearGradient
                            colors={colors.gradient.primary}
                            style={[styles.sessionProgressFill, { width: `${sessionProgress}%` }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          />
                        </View>
                      </View>

                      {/* Bouton de reprogrammation pour les sessions non terminées */}
                      {session.status !== "completed" && !expanded && (
                        <TouchableOpacity
                          onPress={() => handleChangeDate(session._id)}
                          style={styles.rescheduleButton}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="create-outline" size={14} color={colors.primary} />
                          <Text style={styles.rescheduleText}>Reschedule</Text>
                        </TouchableOpacity>
                      )}

                      {/* Contenu étendu */}
                      {expanded && (
                        <View style={styles.exercisesContainer}>
                          {session.exercices.map((exercise: Exercice) => (
                            <View key={exercise._id} style={styles.exerciseCard}>
                              <View style={styles.exerciseContent}>
                                <Text style={styles.exerciseTitle}>
                                  {capitalizeWords(exercise.nom)} ({exercise.repetitions})
                                </Text>
                                <Text style={styles.exerciseInstructions}>{exercise.instructions}</Text>
                              </View>
                              <View style={styles.exerciseToggle}>
                                <Text style={styles.toggleLabel}>Done</Text>
                                <Switch
                                  value={doneMap[session._id]?.includes(exercise._id) || false}
                                  onValueChange={(val) => handleToggleExercise(session._id, exercise._id, val)}
                                  trackColor={{
                                    true: colors.primaryLight,
                                    false: colors.onSurfaceMuted,
                                  }}
                                  thumbColor={
                                    doneMap[session._id]?.includes(exercise._id) ? colors.primary : colors.surface
                                  }
                                />
                              </View>
                            </View>
                          ))}
                          {/* Bouton Terminer la session */}
                          {session.status !== "completed" && allExercisesCompleted && (
                            <TouchableOpacity
                              style={styles.finishSessionButton}
                              onPress={() => handleMarkDone(session._id)}
                              activeOpacity={0.8}
                            >
                              <LinearGradient colors={colors.gradient.primary} style={styles.startButtonGradient}>
                                <Ionicons name="checkmark-circle" size={20} color={colors.surface} />
                                <Text style={styles.startButtonText}>Finish Session</Text>
                              </LinearGradient>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <LinearGradient colors={colors.gradient.secondary} style={styles.emptyIcon}>
                    <Ionicons name="calendar-outline" size={52} color={colors.surface} />
                  </LinearGradient>
                </View>
                <Text style={styles.emptyTitle}>No sessions scheduled</Text>
                <Text style={styles.emptySubtitle}>Sessions will appear here once they are scheduled</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  )
}

export default TrainingDetailScreen

// Styles épurés et modernes avec police plus claire - IDENTIQUES à TrainingsScreen
const styles = StyleSheet.create({
  // Layout principal
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
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
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 24,
  },

  // Section héro
  heroSection: {
    height: height * 0.45,
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
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
  headerActions: {
    position: "absolute",
    top: 50,
    right: 24,
    flexDirection: "row",
    gap: 12,
    zIndex: 2,
  },
  modernAddButton: {
    position: "relative",
  },
  addButtonGradient: {
    width: 42,
    height: 42,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonGlow: {
    
  },
  heroContent: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.surface,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "400",
  },
  progressSection: {
    alignItems: "center",
  },

  // Progression élégante
  elegantProgress: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 70,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  progressInner: {
    alignItems: "center",
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.surface,
    letterSpacing: 1,
  },
  progressSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
    fontWeight: "500",
  },
  progressRing: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.surface,
    borderRadius: 2,
  },

  // Section de contenu
  contentSection: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Section des statistiques
  statsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 72) / 2,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  statIconContainer: {
    marginBottom: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: colors.onSurfaceMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.onSurface,
    textAlign: "center",
    lineHeight: 22,
  },

  // Carte de section
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionHeader: {
    marginBottom: 16,
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

  // Programmes
  programsSection: {
    marginBottom: 20,
  },
  programsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: 20,
    letterSpacing: -0.5,
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

  // Sessions
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  sessionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sessionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryUltraLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  sessionNumberCompleted: {
    backgroundColor: colors.success,
  },
  sessionNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  sessionDate: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
  },
  sessionRight: {
    alignItems: "flex-end",
  },
  sessionProgress: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  sessionProgressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sessionProgressBar: {
    height: 3,
    backgroundColor: "rgba(142, 154, 175, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  sessionProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  rescheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primaryUltraLight,
    borderRadius: 12,
    gap: 8,
  },
  rescheduleText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },

  // Exercices
  exercisesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    padding: 18,
  },
  exerciseContent: {
    flex: 1,
    marginRight: 16,
  },
  exerciseTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurface,
    marginBottom: 8,
    lineHeight: 20,
  },
  exerciseInstructions: {
    fontSize: 13,
    color: colors.onSurfaceMuted,
    lineHeight: 18,
  },
  exerciseToggle: {
    alignItems: "center",
    gap: 8,
  },
  toggleLabel: {
    fontSize: 11,
    color: colors.onSurfaceMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Bouton Terminer la session
  finishSessionButton: {
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
  headerButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  headerButtonContent: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  deleteButtonContent: {
    backgroundColor: "rgba(244, 67, 54, 0.8)",
    borderColor: "rgba(244, 67, 54, 0.9)",
  },
})
