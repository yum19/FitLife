"use client"
import { useLocalSearchParams } from "expo-router"
import { useEffect, useState, useRef } from "react"
import { useFocusEffect } from "@react-navigation/native"
import { useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  Switch,
  Animated,
  Dimensions,
  Easing,
  Vibration,
  StatusBar,
  Image, // Import Image
} from "react-native"
import { Video, ResizeMode } from "expo-av" // Import Video and ResizeMode
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

const API_BASE_URL = "http://192.168.1.8:5000/api"
const { width, height } = Dimensions.get("window")
// Hauteur estimée de la navbar (ajustez selon votre design)
const NAVBAR_HEIGHT = 100

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// Palette de couleurs moderne et contrastée - IDENTIQUE aux autres écrans
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
  return str
    .split(" ")
    .map((word) => capitalizeFirst(word))
    .join(" ")
}

// Fonction pour formater la durée d'un exercice en minutes et secondes
const formatExerciseDuration = (seconds: number | undefined) => {
  if (seconds === undefined || seconds === null) return "N/A"
  if (seconds < 60) {
    return `${seconds} sec`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (remainingSeconds === 0) {
    return `${minutes} min`
  }
  return `${minutes} min ${remainingSeconds} sec`
}

// Rest time options
const REST_TIME_OPTIONS = {
  short: { value: 30, label: "Short (30s)", icon: "flash-outline" },
  normal: { value: 60, label: "Normal (60s)", icon: "time-outline" },
  long: { value: 90, label: "Long (90s)", icon: "hourglass-outline" },
  custom: { value: 120, label: "Extended (2min)", icon: "timer-outline" },
}

interface Exercice {
  _id: string
  nom: string
  repetitions: string
  instructions: string
  duree?: number
  imageUrl?: string // Added imageUrl
  videoUrl?: string // Added videoUrl
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
  actif: boolean
  createdAt: string
  seances?: Seance[]
  frequency?: string // Added frequency
  duration?: string // Added duration
}

// Helper functions for program-specific storage keys
const getKeyForSeance = (seanceId: string) => `doneExercises_${seanceId}`
const getKeyForProgramStreak = (programId: string) => `program_streak_${programId}`
const getKeyForProgramWorkouts = (programId: string) => `program_workouts_${programId}`
const getKeyForLastWorkoutDate = (programId: string) => `program_lastWorkout_${programId}`
const getKeyForRestTime = (programId: string) => `program_restTime_${programId}`

// Utility functions for date comparison
const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

const getDaysDifference = (date1: Date, date2: Date) => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Calculate realistic session duration
const calculateSessionDuration = (exercices: Exercice[], restTimeSeconds = 60) => {
  if (!exercices || exercices.length === 0) return 0

  // Total exercise time in seconds
  const exerciseTime = exercices.reduce((total, exercise) => {
    return total + (exercise.duree || 45) // Use exercise.duree which is now dynamic
  }, 0)

  // Rest time between exercises (number of exercises - 1) * rest time
  const restTime = Math.max(0, (exercices.length - 1) * restTimeSeconds)

  // Total time in minutes (rounded up)
  return Math.ceil((exerciseTime + restTime) / 60)
}

// Composant de chargement minimaliste - IDENTIQUE au style des autres écrans
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingContent}>
      <LinearGradient colors={colors.gradient.primary} style={styles.loadingIcon}>
        <ActivityIndicator size="large" color={colors.surface} />
      </LinearGradient>
      <Text style={styles.loadingText}>Loading your workout</Text>
    </View>
  </View>
)

export default function StartTrainingScreen() {
  const { programmeId } = useLocalSearchParams()
  const [programme, setProgramme] = useState<Programme | null>(null)
  const [loading, setLoading] = useState(true)
  const [doneMap, setDoneMap] = useState<{ [key: string]: string[] }>({})
  const [progressMap, setProgressMap] = useState<{ [key: string]: number }>({})
  const [expandedSeances, setExpandedSeances] = useState<{ [key: string]: boolean }>({})
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [streak, setStreak] = useState(0)
  const [totalWorkouts, setTotalWorkouts] = useState(0)
  const [restTimePreference, setRestTimePreference] = useState<keyof typeof REST_TIME_OPTIONS>("normal")
  const [showRestSettings, setShowRestSettings] = useState(false)
  const insets = useSafeAreaInsets()

  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0]
  const slideAnim = useState(new Animated.Value(width))[0]
  const scaleAnim = useState(new Animated.Value(1))[0]
  const pulseAnim = useState(new Animated.Value(1))[0]

  const videoRef = useRef<Video>(null) // Ref for video player
  const [videoStatus, setVideoStatus] = useState<any>({}) // State for video playback status

  // Load rest time preference
  const loadRestTimePreference = async (programId: string) => {
    try {
      const savedRestTime = await AsyncStorage.getItem(getKeyForRestTime(programId))
      if (savedRestTime && REST_TIME_OPTIONS[savedRestTime as keyof typeof REST_TIME_OPTIONS]) {
        setRestTimePreference(savedRestTime as keyof typeof REST_TIME_OPTIONS)
      }
    } catch (error) {
      console.error("Error loading rest time preference:", error)
    }
  }

  // Save rest time preference
  const saveRestTimePreference = async (programId: string, restTime: keyof typeof REST_TIME_OPTIONS) => {
    try {
      await AsyncStorage.setItem(getKeyForRestTime(programId), restTime)
      setRestTimePreference(restTime)
    } catch (error) {
      console.error("Error saving rest time preference:", error)
    }
  }

  // Load program-specific stats with better error handling
  const loadProgramStats = async (programId: string) => {
    try {
      const [savedStreak, savedWorkouts, lastWorkoutDate] = await Promise.all([
        AsyncStorage.getItem(getKeyForProgramStreak(programId)),
        AsyncStorage.getItem(getKeyForProgramWorkouts(programId)),
        AsyncStorage.getItem(getKeyForLastWorkoutDate(programId)),
      ])

      let currentStreak = savedStreak ? Number.parseInt(savedStreak) : 0
      const currentWorkouts = savedWorkouts ? Number.parseInt(savedWorkouts) : 0

      // Check if streak should be reset
      if (lastWorkoutDate && currentStreak > 0) {
        const lastDate = new Date(lastWorkoutDate)
        const today = new Date()
        const daysDiff = getDaysDifference(lastDate, today)

        // Reset streak if more than 1 day has passed
        if (daysDiff > 1) {
          currentStreak = 0
          await AsyncStorage.setItem(getKeyForProgramStreak(programId), "0")
        }
      }

      setStreak(currentStreak)
      setTotalWorkouts(currentWorkouts)
    } catch (error) {
      console.error("Error loading program stats:", error)
      // Set default values on error
      setStreak(0)
      setTotalWorkouts(0)
    }
  }

  // Save program-specific stats with better error handling
  const saveProgramStats = async (programId: string, newStreak: number, newWorkouts: number) => {
    try {
      const today = new Date().toISOString()
      await Promise.all([
        AsyncStorage.setItem(getKeyForProgramStreak(programId), newStreak.toString()),
        AsyncStorage.setItem(getKeyForProgramWorkouts(programId), newWorkouts.toString()),
        AsyncStorage.setItem(getKeyForLastWorkoutDate(programId), today),
      ])
    } catch (error) {
      console.error("Error saving program stats:", error)
    }
  }

  // Initialize stats if they don't exist
  const initializeProgramStats = async (programId: string) => {
    try {
      const existingStreak = await AsyncStorage.getItem(getKeyForProgramStreak(programId))
      const existingWorkouts = await AsyncStorage.getItem(getKeyForProgramWorkouts(programId))

      if (existingStreak === null) {
        await AsyncStorage.setItem(getKeyForProgramStreak(programId), "0")
      }
      if (existingWorkouts === null) {
        await AsyncStorage.setItem(getKeyForProgramWorkouts(programId), "0")
      }
    } catch (error) {
      console.error("Error initializing program stats:", error)
    }
  }

  // API fetch logic with improved stats loading
  useFocusEffect(
    useCallback(() => {
      const fetchProgramme = async () => {
        try {
          setLoading(true)
          if (!programmeId) {
            console.error("No programme ID provided")
            return
          }

          // Initialize stats first
          await initializeProgramStats(programmeId as string)
          // Load rest time preference
          await loadRestTimePreference(programmeId as string)

          const token = await AsyncStorage.getItem("authToken")
          const res = await fetch(`${API_BASE_URL}/programme/${programmeId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (!res.ok) throw new Error("Error loading program")
          const data = await res.json()
          setProgramme(data)

          // Load program-specific stats
          await loadProgramStats(programmeId as string)

          const done: { [k: string]: string[] } = {}
          const prog: { [k: string]: number } = {}
          for (const s of data.seances || []) {
            const saved = await AsyncStorage.getItem(getKeyForSeance(s._id))
            const arr = saved ? JSON.parse(saved) : []
            done[s._id] = arr
            prog[s._id] = (arr.length / (s.exercices.length || 1)) * 100
          }
          setDoneMap(done)
          setProgressMap(prog)

          // Animation when data loads
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start()
        } catch (error) {
          console.error("Error fetching programme:", error)
          Alert.alert("Error", "Unable to load the program.")
        } finally {
          setLoading(false)
        }
      }

      fetchProgramme()
    }, [programmeId]),
  )

  // Timer effect
  useEffect(() => {
    let interval: number | null = null
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000) as unknown as number
    }
    return () => {
      if (interval !== null) {
        clearInterval(interval)
      }
    }
  }, [isTimerRunning])

  // Rest timer effect
  useEffect(() => {
    let interval: number | null = null
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false)
            Vibration.vibrate([0, 500, 200, 500])
            return 0
          }
          return prev - 1
        })
      }, 1000) as unknown as number
    }
    return () => {
      if (interval !== null) {
        clearInterval(interval)
      }
    }
  }, [isResting, restTimer])

  // Pulse animation for active elements
  useEffect(() => {
    let pulse: Animated.CompositeAnimation | null = null
    if (isTimerRunning) {
      pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      )
      pulse.start()
    } else {
      pulseAnim.setValue(1)
    }
    return () => {
      if (pulse) {
        pulse.stop()
      }
    }
  }, [isTimerRunning])

  // Function to toggle video playback
  const toggleVideoPlayback = async () => {
    if (videoRef.current) {
      if (videoStatus.isPlaying) {
        await videoRef.current.pauseAsync()
      } else {
        await videoRef.current.playAsync()
      }
    }
  }

  const startSession = (seanceId: string, isRestart = false) => {
    if (!programme) return
    const seance = programme.seances?.find((s) => s._id === seanceId)
    if (!seance) return

    // If it's a restart, clear all completed exercises
    if (isRestart) {
      handleRestartSession(seanceId)
      return
    }

    // Find the next uncompleted exercise to start from
    const doneExercises = doneMap[seanceId] || []
    let startIndex = 0
    // Find the first exercise that hasn't been completed
    for (let i = 0; i < seance.exercices.length; i++) {
      if (!doneExercises.includes(seance.exercices[i]._id)) {
        startIndex = i
        break
      }
    }

    // If all exercises are done, start from the beginning
    if (startIndex === 0 && doneExercises.length === seance.exercices.length) {
      startIndex = 0
    }

    setActiveSession(seanceId)
    setCurrentExerciseIndex(startIndex)
    setTimer(0)
    setIsTimerRunning(true)

    // Haptic feedback
    Vibration.vibrate(100)

    // Slide animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: true,
    }).start()
  }

  const handleRestartSession = async (seanceId: string) => {
    // Clear all completed exercises for this session
    setDoneMap({ ...doneMap, [seanceId]: [] })
    setProgressMap({ ...progressMap, [seanceId]: 0 })
    await AsyncStorage.setItem(getKeyForSeance(seanceId), JSON.stringify([]))

    // Start the session from the beginning
    setActiveSession(seanceId)
    setCurrentExerciseIndex(0)
    setTimer(0)
    setIsTimerRunning(true)

    // Haptic feedback
    Vibration.vibrate(100)

    // Slide animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: true,
    }).start()
  }

  const endSession = () => {
    setActiveSession(null)
    setIsTimerRunning(false)
    setIsResting(false)
    slideAnim.setValue(width)
  }

  const handleNextExercise = async () => {
    if (!activeSession || !programme) return
    const seance = programme.seances?.find((s) => s._id === activeSession)
    if (!seance) return

    // Before `const currentExercise = seance.exercices[currentExerciseIndex]`
    console.log("handleNextExercise: Current seance object:", seance)
    console.log("handleNextExercise: Seance exercises array:", seance.exercices)
    const currentExercise = seance.exercices[currentExerciseIndex]
    // After `const currentExercise = seance.exercices[currentExerciseIndex]`
    console.log("handleNextExercise: Current exercise object:", currentExercise)

    // Defensive check for currentExercise and its _id
    if (!currentExercise || !currentExercise._id) {
      console.warn(
        "handleNextExercise: Invalid exercise or missing ID at index:",
        currentExerciseIndex,
        "Exercise:",
        currentExercise,
      )
      // If the current exercise is invalid or missing ID, we should not proceed with it.
      // If it's the last index, consider the session done. Otherwise, try to advance.
      if (currentExerciseIndex >= seance.exercices.length - 1) {
        console.log("handleNextExercise: Reached end of session with invalid exercise. Marking session done.")
        handleMarkDone(activeSession)
        endSession()
      } else {
        console.log("handleNextExercise: Skipping invalid exercise and moving to next.")
        setCurrentExerciseIndex(currentExerciseIndex + 1)
        setIsResting(true) // Start rest as if an exercise was completed
        setRestTimer(REST_TIME_OPTIONS[restTimePreference].value)
      }
      return
    }

    console.log(
      "handleNextExercise: Processing exercise at index",
      currentExerciseIndex,
      "with ID:",
      currentExercise._id,
    )
    console.log("handleNextExercise: doneMap before update for session", activeSession, ":", doneMap[activeSession])

    // Mark current exercise as completed only if it's not already done
    const doneExercises = doneMap[activeSession] || []
    if (!doneExercises.includes(currentExercise._id)) {
      console.log("handleNextExercise: Marking exercise", currentExercise._id, "as done.")
      await handleToggleExercise(activeSession, currentExercise._id, true)
    } else {
      console.log("handleNextExercise: Exercise", currentExercise._id, "already marked as done. Skipping toggle.")
    }

    // Check if this was the last exercise
    if (currentExerciseIndex >= seance.exercices.length - 1) {
      console.log("handleNextExercise: Last exercise reached. Marking session done.")
      handleMarkDone(activeSession)
      endSession()
      return
    }

    // Start rest period with user's preferred time
    console.log("handleNextExercise: Starting rest period.")
    setIsResting(true)
    setRestTimer(REST_TIME_OPTIONS[restTimePreference].value)

    // Navigate to next exercise
    const nextIndex = currentExerciseIndex + 1
    console.log("handleNextExercise: Moving to next exercise index:", nextIndex)
    setCurrentExerciseIndex(nextIndex)
  }

  const handlePrevExercise = async () => {
    if (!activeSession || currentExerciseIndex <= 0 || !programme) return
    const seance = programme.seances?.find((s) => s._id === activeSession)
    if (!seance) return

    // Unmark the current exercise when going back
    const currentExercise = seance.exercices[currentExerciseIndex]
    if (currentExercise && currentExercise._id) {
      // Ensure _id exists before unmarking
      console.log("handlePrevExercise: Unmarking exercise", currentExercise._id)
      await handleToggleExercise(activeSession, currentExercise._id, false)
    }

    // Navigate to previous exercise
    const prevIndex = currentExerciseIndex - 1
    console.log("handlePrevExercise: Moving to previous exercise index:", prevIndex)
    setCurrentExerciseIndex(prevIndex)
  }

  const handleToggleExercise = async (seanceId: string, exId: string | undefined, value: boolean) => {
    console.log("handleToggleExercise: Called for seanceId:", seanceId, "exId:", exId, "value:", value)
    if (!exId) {
      // Added defensive check for exId
      console.warn("handleToggleExercise: Attempted to toggle exercise with undefined ID. Skipping.")
      return
    }
    const arr = doneMap[seanceId] || []
    console.log("handleToggleExercise: Current done exercises for session (before logic):", arr)
    let newArr = [...arr] // Create a copy to work with
    if (value) {
      if (!newArr.includes(exId)) {
        newArr = [...newArr, exId] // Add if not present
        console.log("handleToggleExercise: Added", exId, ". New array:", newArr)
      } else {
        console.log("handleToggleExercise: Exercise", exId, "already in done list. No change.")
      }
    } else {
      newArr = newArr.filter((id) => id !== exId) // Remove if value is false
      console.log("handleToggleExercise: Removed", exId, ". New array:", newArr)
    }
    setDoneMap((prevDoneMap) => ({ ...prevDoneMap, [seanceId]: newArr }))
    const seance = programme?.seances?.find((s) => s._id === seanceId)
    const progress = (newArr.length / (seance?.exercices.length || 1)) * 100
    setProgressMap((prevProgressMap) => ({ ...prevProgressMap, [seanceId]: progress }))
    console.log("handleToggleExercise: doneMap state updated for session", seanceId, "to:", newArr)
    console.log("handleToggleExercise: progressMap state updated for session", seanceId, "to:", progress)
    await AsyncStorage.setItem(getKeyForSeance(seanceId), JSON.stringify(newArr))
    // Haptic feedback
    Vibration.vibrate(50)
  }

  const handleMarkDone = async (seanceId: string) => {
    try {
      // Check if session is already completed to avoid double counting
      const currentSeance = programme?.seances?.find((s) => s._id === seanceId)
      const isAlreadyCompleted = currentSeance?.status === "completed"

      const token = await AsyncStorage.getItem("authToken")
      await fetch(`${API_BASE_URL}/seances/${seanceId}/terminer`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })

      await fetch(`${API_BASE_URL}/seance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          seanceId,
          exercicesRealises: doneMap[seanceId].map((id) => ({
            exerciceId: id,
            series: 3,
            repetitions: 12,
            poids: 0,
          })),
          dureeReelle: timer,
          statut: "completed",
        }),
      })

      setProgramme((prev) =>
        prev
          ? {
              ...prev,
              seances: prev.seances?.map((s) => (s._id === seanceId ? { ...s, status: "completed" } : s)),
            }
          : null,
      )

      // Only increment stats if session wasn't already completed
      if (!isAlreadyCompleted && programmeId) {
        const today = new Date()
        const lastWorkoutDateStr = await AsyncStorage.getItem(getKeyForLastWorkoutDate(programmeId as string))
        let newStreak = streak
        const newWorkouts = totalWorkouts + 1

        // Calculate streak logic
        if (lastWorkoutDateStr) {
          const lastWorkoutDate = new Date(lastWorkoutDateStr)
          const today = new Date()
          const daysDiff = getDaysDifference(lastWorkoutDate, today)

          if (isSameDay(lastWorkoutDate, today)) {
            // Same day, don't increment streak but increment workouts
            newStreak = streak
          } else if (daysDiff === 1) {
            // Consecutive day, increment streak
            newStreak = streak + 1
          } else {
            // Gap in days, reset streak to 1
            newStreak = 1
          }
        } else {
          // First workout ever for this program
          newStreak = 1
        }

        // Save program-specific stats FIRST
        await saveProgramStats(programmeId as string, newStreak, newWorkouts)
        // Then update local state
        setTotalWorkouts(newWorkouts)
        setStreak(newStreak)

        // Show alert with correct new values
        Alert.alert(
          "🎉 Workout Complete!",
          `Great job! You've completed another workout. Current streak: ${newStreak} days!`,
          [{ text: "Awesome!", style: "default" }],
        )
      } else {
        // Session was already completed
        Alert.alert(
          "🎉 Workout Complete!",
          `Great job! You've completed this workout. Current streak: ${streak} days!`,
          [{ text: "Awesome!", style: "default" }],
        )
      }
    } catch (error) {
      console.error("Error marking session as done:", error)
      Alert.alert("Error", "Unable to complete session.")
    }
    // Force refresh stats to ensure UI is updated
    setTimeout(() => {
      refreshStats()
    }, 100)
  }

  // Add this function after handleMarkDone
  const refreshStats = async () => {
    if (programmeId) {
      await loadProgramStats(programmeId as string)
    }
  }

  const toggleSeance = (id: string) => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "easeInEaseOut" },
    })
    setExpandedSeances({ ...expandedSeances, [id]: !expandedSeances[id] })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleRestTimeChange = async (newRestTime: keyof typeof REST_TIME_OPTIONS) => {
    if (programmeId) {
      await saveRestTimePreference(programmeId as string, newRestTime)
    }
    setShowRestSettings(false)
  }

  // Rest Settings Modal Component
  const RestSettingsModal = () => (
    <>
      {showRestSettings && (
        <View style={styles.settingsOverlayContainer}>
          <View style={styles.settingsOverlayBackground} />
          <View style={styles.settingsModalContainer}>
            <Text style={styles.modalTitle}>Rest Time Settings</Text>
            <Text style={styles.modalSubtitle}>Choose your preferred rest time between exercises</Text>
            {Object.entries(REST_TIME_OPTIONS).map(([key, option]) => (
              <TouchableOpacity
                key={key}
                style={[styles.restOption, restTimePreference === key && styles.restOptionSelected]}
                onPress={() => handleRestTimeChange(key as keyof typeof REST_TIME_OPTIONS)}
                activeOpacity={0.8}
              >
                <View style={styles.restOptionLeft}>
                  <View style={styles.restOptionIcon}>
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={restTimePreference === key ? colors.surface : colors.primary}
                    />
                  </View>
                  <Text style={[styles.restOptionText, restTimePreference === key && styles.restOptionTextSelected]}>
                    {option.label}
                  </Text>
                </View>
                {restTimePreference === key && <Ionicons name="checkmark-circle" size={24} color={colors.surface} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowRestSettings(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  )

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

  // Active session view
  if (activeSession) {
    const seance = programme.seances?.find((s) => s._id === activeSession)
    const exercise = seance?.exercices[currentExerciseIndex]
    console.log("Current Exercise Data:", exercise)
    const totalExercises = seance?.exercices.length || 0

    return (
      <View style={styles.sessionContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        {/* Header */}
        <LinearGradient colors={colors.gradient.primary} style={styles.sessionHeader}>
          <TouchableOpacity onPress={endSession} style={styles.modernAddButton} activeOpacity={0.8}>
            <LinearGradient colors={colors.gradient.primaryReverse} style={styles.addButtonGradient}>
              <Ionicons name="arrow-back" size={20} color={colors.surface} />
            </LinearGradient>
            <View style={styles.buttonGlow} />
          </TouchableOpacity>
          <View style={styles.sessionHeaderCenter}>
            <Text style={styles.sessionTitle}>Active Workout</Text>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Text style={styles.timerText}>{formatTime(timer)}</Text>
            </Animated.View>
          </View>
          <TouchableOpacity
            style={styles.modernAddButton}
            onPress={() => setShowRestSettings(true)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={colors.gradient.primaryReverse} style={styles.addButtonGradient}>
              <Ionicons name="settings-outline" size={20} color={colors.surface} />
            </LinearGradient>
            <View style={styles.buttonGlow} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Rest Timer Overlay */}
        {isResting && (
          <View style={styles.restOverlayContainer}>
            <View style={styles.restOverlayBackground} />
            <View style={styles.restContainer}>
              <Text style={styles.restTitle}>Rest Time</Text>
              <Text style={styles.restTimer}>{formatTime(restTimer)}</Text>
              <Text style={styles.restSubtitle}>Get ready for next exercise</Text>
              <View style={styles.restInfo}>
                <View style={styles.restInfoIcon}>
                  <Ionicons name={REST_TIME_OPTIONS[restTimePreference].icon as any} size={20} color={colors.primary} />
                </View>
                <Text style={styles.restInfoText}>{REST_TIME_OPTIONS[restTimePreference].label}</Text>
              </View>
              <TouchableOpacity style={styles.skipRestButton} onPress={() => setIsResting(false)} activeOpacity={0.8}>
                <LinearGradient colors={colors.gradient.primary} style={styles.skipRestGradient}>
                  <Text style={styles.skipRestText}>Skip Rest</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Exercise Container with Vertical Scroll Only */}
        <View style={styles.exerciseContainer}>
          {/* Progress */}
          <View style={styles.exerciseProgress}>
            <Text style={styles.exerciseCounter}>
              Exercise {currentExerciseIndex + 1} of {totalExercises}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={colors.gradient.primary}
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${((doneMap[activeSession]?.length || 0) / totalExercises) * 100}%`,
                    },
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
          </View>

          {/* Vertical ScrollView for exercise content */}
          <ScrollView
            style={styles.exerciseVerticalScroll}
            contentContainerStyle={styles.exerciseVerticalScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Exercise Card */}
            <View style={styles.exerciseCard}>
              {/* Media Display */}
              {exercise?.imageUrl ? (
                <Image source={{ uri: exercise.imageUrl }} style={styles.exerciseImage} resizeMode="contain" />
              ) : exercise?.videoUrl ? (
                <View style={styles.videoContainer}>
                  <Video
                    ref={videoRef}
                    style={styles.exerciseVideo}
                    source={{ uri: exercise.videoUrl }}
                    useNativeControls={false} // We'll use custom controls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping
                    onPlaybackStatusUpdate={setVideoStatus}
                  />
                  <TouchableOpacity onPress={toggleVideoPlayback} style={styles.videoPlayButton}>
                    <Ionicons
                      name={videoStatus.isPlaying ? "pause-circle" : "play-circle"}
                      size={64}
                      color={colors.surface}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.noMediaContainer}>
                  <Ionicons name="image-outline" size={64} color={colors.onSurfaceMuted} />
                  <Text style={styles.noMediaText}>No visual available</Text>
                </View>
              )}

              <View style={styles.exerciseIconContainer}>
                <LinearGradient colors={colors.gradient.primary} style={styles.exerciseIconGradient}>
                  <Ionicons name="fitness-outline" size={32} color={colors.surface} />
                </LinearGradient>
              </View>
              <Text style={styles.exerciseName}>{capitalizeWords(exercise?.nom || "")}</Text>
              <View style={styles.exerciseRepsContainer}>
                <View style={styles.exerciseRepsIcon}>
                  <Ionicons name="repeat-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.exerciseRepsText}>{exercise?.repetitions}</Text>
              </View>
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>Instructions</Text>
                <Text style={styles.instructionsText}>{exercise?.instructions}</Text>
              </View>
              <View style={styles.durationContainer}>
                <View style={styles.durationIcon}>
                  <Ionicons name="timer-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.durationText}>{formatExerciseDuration(exercise?.duree)}</Text>
              </View>

              {/* Show if current exercise is already done */}
              {exercise && doneMap[activeSession]?.includes(exercise._id) && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.completedText}>Already completed</Text>
                </View>
              )}
            </View>

            {/* Add some bottom padding for better scrolling */}
            <View style={styles.exerciseBottomPadding} />
          </ScrollView>

          {/* Exercise Navigation Controls */}
          <View style={styles.exerciseControls}>
            <TouchableOpacity
              style={[styles.controlButton, currentExerciseIndex === 0 && styles.controlButtonDisabled]}
              onPress={handlePrevExercise}
              disabled={currentExerciseIndex === 0}
              activeOpacity={0.8}
            >
              <View style={styles.controlButtonIcon}>
                <Ionicons
                  name="chevron-back-circle-outline"
                  size={48}
                  color={currentExerciseIndex === 0 ? colors.onSurfaceMuted : colors.primary}
                />
              </View>
              <Text style={[styles.controlButtonText, currentExerciseIndex === 0 && styles.controlButtonTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mainControlButton} onPress={handleNextExercise} activeOpacity={0.8}>
              <LinearGradient colors={colors.gradient.primary} style={styles.mainControlGradient}>
                <Ionicons
                  name={currentExerciseIndex === totalExercises - 1 ? "checkmark-circle" : "chevron-forward-circle"}
                  size={32}
                  color={colors.surface}
                />
                <Text style={styles.mainControlButtonText}>
                  {currentExerciseIndex === totalExercises - 1 ? "Finish" : "Next"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Modal */}
        <RestSettingsModal />
      </View>
    )
  }

  // Main program view
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 20,
            // MODIFICATION PRINCIPALE: Ajout d'un padding bottom pour éviter que le contenu soit caché sous la navbar
            paddingBottom: insets.bottom + NAVBAR_HEIGHT + 20,
          },
        ]}
      >
        {/* Hero Section with integrated stats */}
        <View style={styles.heroContainer}>
          <LinearGradient colors={colors.gradient.primary} style={styles.heroGradient}>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{capitalizeWords(programme.objectif)}</Text>
              <Text style={styles.heroSubtitle}>{capitalizeWords(programme.niveau)} Level Program</Text>

              {/* Stats Row integrated in hero */}
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatNumber}>{streak}</Text>
                  <Text style={styles.heroStatLabel}>Day Streak</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatNumber}>{totalWorkouts}</Text>
                  <Text style={styles.heroStatLabel}>Workouts</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatNumber}>
                    {programme.seances?.reduce((acc, s) => acc + s.exercices.length, 0) || 0}
                  </Text>
                  <Text style={styles.heroStatLabel}>Exercises</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Stats with realistic time calculation */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStatCard}>
            <View style={styles.quickStatContent}>
              <View style={styles.quickStatIcon}>
                <Ionicons name="calendar-outline" size={24} color={colors.success} />
              </View>
              <Text style={styles.quickStatNumber}>{programme.seances?.length || 0}</Text>
              <Text style={styles.quickStatLabel}>Sessions</Text>
            </View>
          </View>
          <View style={styles.quickStatCard}>
            <View style={styles.quickStatContent}>
              <View style={styles.quickStatIcon}>
                <Ionicons name="time-outline" size={24} color={colors.warning} />
              </View>
              <Text style={styles.quickStatNumber}>{programme.duration || "N/A"}</Text>
              <Text style={styles.quickStatLabel}>Min/Session</Text>
            </View>
          </View>
          <View style={styles.quickStatCard}>
            <View style={styles.quickStatContent}>
              <View style={styles.quickStatIcon}>
                <Ionicons name="repeat-outline" size={24} color={colors.info} />
              </View>
              <Text style={styles.quickStatNumber}>{programme.frequency || "N/A"}</Text>
              <Text style={styles.quickStatLabel}>Days/Week</Text>
            </View>
          </View>
        </View>

        {/* Rest Time Settings Card */}
        <View style={styles.restSettingsCard}>
          <TouchableOpacity style={styles.restSettingsButton} onPress={() => setShowRestSettings(true)}>
            <View style={styles.restSettingsLeft}>
              <View style={styles.restSettingsIcon}>
                <Ionicons name={REST_TIME_OPTIONS[restTimePreference].icon as any} size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.restSettingsTitle}>Rest Time</Text>
                <Text style={styles.restSettingsSubtitle}>{REST_TIME_OPTIONS[restTimePreference].label}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceMuted} />
          </TouchableOpacity>
        </View>

        {/* Equipment Section */}
        <View style={styles.equipmentSection}>
          <Text style={styles.sectionTitle}>Equipment Needed</Text>
          <View style={styles.equipmentGrid}>
            {programme.materiel.length > 0 ? (
              programme.materiel.map((item, index) => (
                <View key={index} style={styles.equipmentItem}>
                  <View style={styles.equipmentIcon}>
                    <Ionicons name="barbell-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.equipmentText}>{capitalizeWords(item)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.noEquipmentContainer}>
                <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                <Text style={styles.noEquipmentText}>No equipment needed!</Text>
              </View>
            )}
          </View>
        </View>

        {/* Sessions */}
        <View style={styles.sessionsSection}>
          <View style={styles.programsHeader}>
            <Text style={styles.sectionTitle}>Training Sessions</Text>
            <View style={styles.counter}>
              <Text style={styles.counterText}>{programme.seances?.length || 0}</Text>
            </View>
          </View>
          {programme.seances?.map((seance, index) => {
            const expanded = expandedSeances[seance._id]
            const progress = progressMap[seance._id] || 0
            const isCompleted = seance.status === "completed"
            const sessionDuration = calculateSessionDuration(
              seance.exercices,
              REST_TIME_OPTIONS[restTimePreference].value,
            )

            return (
              <View key={seance._id} style={styles.sessionCard}>
                <TouchableOpacity
                  onPress={() => toggleSeance(seance._id)}
                  style={styles.sessionCardHeader}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionCardLeft}>
                    <View style={[styles.sessionNumber, isCompleted && styles.sessionNumberCompleted]}>
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={16} color={colors.surface} />
                      ) : (
                        <Text style={styles.sessionNumberText}>{index + 1}</Text>
                      )}
                    </View>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionDate}>
                        {new Date(seance.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                      <Text style={styles.sessionExerciseCount}>
                        {seance.exercices.length} exercises • {sessionDuration} min
                      </Text>
                    </View>
                  </View>
                  <View style={styles.sessionCardRight}>
                    <View style={styles.progressCircle}>
                      <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                    </View>
                    <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.onSurfaceMuted} />
                  </View>
                </TouchableOpacity>

                {/* Progress Bar */}
                <View style={styles.sessionProgressContainer}>
                  <View style={styles.sessionProgressBar}>
                    <LinearGradient
                      colors={colors.gradient.primary}
                      style={[styles.sessionProgressFill, { width: `${progress}%` }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                </View>

                {/* Expanded Content */}
                {expanded && (
                  <View style={styles.sessionDetails}>
                    <View style={styles.exercisesList}>
                      {seance.exercices.map((exercise, exIndex) => (
                        <View key={exercise._id} style={styles.exerciseListItem}>
                          <View style={styles.exerciseListLeft}>
                            <View style={styles.exerciseListIcon}>
                              <Text style={styles.exerciseListNumber}>{exIndex + 1}</Text>
                            </View>
                            <View>
                              <Text style={styles.exerciseListName}>{capitalizeWords(exercise.nom)}</Text>
                              <Text style={styles.exerciseListReps}>
                                {exercise.repetitions} • {formatExerciseDuration(exercise.duree)}
                              </Text>
                            </View>
                          </View>
                          <Switch
                            value={doneMap[seance._id]?.includes(exercise._id) || false}
                            onValueChange={(val) => handleToggleExercise(seance._id, exercise._id, val)}
                            trackColor={{ true: colors.primaryLight, false: colors.onSurfaceMuted }}
                            thumbColor={doneMap[seance._id]?.includes(exercise._id) ? colors.primary : colors.surface}
                          />
                        </View>
                      ))}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.sessionActions}>
                      <TouchableOpacity
                        style={styles.startSessionButton}
                        onPress={() => {
                          if (progress === 100) {
                            startSession(seance._id, true) // Restart session
                          } else {
                            startSession(seance._id, false) // Normal start/continue
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <LinearGradient colors={colors.gradient.primary} style={styles.startSessionGradient}>
                          <Ionicons name={progress === 100 ? "refresh" : "play"} size={20} color={colors.surface} />
                          <Text style={styles.startSessionText}>
                            {progress === 100
                              ? "Restart Session"
                              : progress > 0 && progress < 100
                                ? "Continue Session"
                                : "Start Session"}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      {!isCompleted && progress > 0 && progress < 100 && (
                        <TouchableOpacity style={styles.completeButton} onPress={() => handleMarkDone(seance._id)}>
                          <Text style={styles.completeButtonText}>Mark Complete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )
          })}
        </View>
      </ScrollView>
      <RestSettingsModal />
    </Animated.View>
  )
}

// Styles épurés et modernes avec police plus claire - IDENTIQUES aux autres écrans
const styles = StyleSheet.create({
  // Loading styles
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
  // General styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  // Hero section
  heroContainer: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  heroGradient: {
    padding: 24,
    minHeight: 180,
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.surface,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 24,
    fontWeight: "500",
  },
  heroStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroStat: {
    alignItems: "center",
  },
  heroStatNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.surface,
  },
  heroStatLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
    fontWeight: "500",
  },
  // Quick stats
  quickStatsContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  quickStatContent: {
    padding: 16,
    alignItems: "center",
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryUltraLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
    marginTop: 8,
  },
  quickStatLabel: {
    fontSize: 12,
    color: colors.onSurfaceMuted,
    marginTop: 4,
    fontWeight: "600",
  },
  // Rest settings card
  restSettingsCard: {
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  restSettingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  restSettingsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  restSettingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryUltraLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  restSettingsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.onSurface,
  },
  restSettingsSubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    fontWeight: "500",
  },
  // Settings Modal
  settingsOverlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000000,
    elevation: 1000000,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsOverlayBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  settingsModalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    margin: 32,
    width: width - 64,
    elevation: 1000001,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000001,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },
  restOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.surfaceVariant,
  },
  restOptionSelected: {
    backgroundColor: colors.primary,
  },
  restOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  restOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryUltraLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  restOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onSurface,
  },
  restOptionTextSelected: {
    color: colors.surface,
  },
  modalCloseButton: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
  },
  // Equipment section
  equipmentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  equipmentGrid: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  equipmentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  equipmentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryUltraLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  equipmentText: {
    fontSize: 16,
    color: colors.onSurface,
    fontWeight: "600",
  },
  noEquipmentContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  noEquipmentText: {
    fontSize: 16,
    color: colors.success,
    fontWeight: "600",
    marginTop: 8,
  },
  // Sessions section
  sessionsSection: {
    marginBottom: 20,
  },
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
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  sessionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  sessionCardLeft: {
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
  },
  sessionNumberCompleted: {
    backgroundColor: colors.success,
  },
  sessionNumberText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 14,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.onSurface,
  },
  sessionExerciseCount: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    fontWeight: "500",
  },
  sessionCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryUltraLight,
    justifyContent: "center",
    alignItems: "center",
  },
  progressText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
  },
  sessionProgressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sessionProgressBar: {
    height: 3,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 2,
    overflow: "hidden",
  },
  sessionProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  // Session details
  sessionDetails: {
    padding: 16,
  },
  exercisesList: {
    marginBottom: 16,
  },
  exerciseListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  exerciseListLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  exerciseListIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  exerciseListNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.onSurfaceVariant,
  },
  exerciseListName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onSurface,
  },
  exerciseListReps: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    fontWeight: "500",
  },
  // Session actions
  sessionActions: {
    gap: 12,
  },
  startSessionButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startSessionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  startSessionText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  completeButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  completeButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  // Active session styles
  sessionContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  modernAddButton: {
    position: "relative",
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
  sessionHeaderCenter: {
    alignItems: "center",
  },
  sessionTitle: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  timerText: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  // Rest overlay
  restOverlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    elevation: 999999,
    justifyContent: "center",
    alignItems: "center",
  },
  restOverlayBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  restContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    margin: 32,
    elevation: 1000000,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    zIndex: 1000000,
  },
  restTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  restTimer: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 8,
    letterSpacing: -1,
  },
  restSubtitle: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginBottom: 16,
    fontWeight: "500",
  },
  restInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  restInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryUltraLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  restInfoText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
  },
  skipRestButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  skipRestGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipRestText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  // Exercise container
  exerciseContainer: {
    flex: 1,
    padding: 20,
  },
  exerciseProgress: {
    marginBottom: 24,
  },
  exerciseCounter: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "600",
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  // Exercise card
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  exerciseIconContainer: {
    marginBottom: 16,
  },
  exerciseIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.onSurface,
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  exerciseRepsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  exerciseRepsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryUltraLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  exerciseRepsText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: "700",
  },
  instructionsContainer: {
    width: "100%",
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.onSurface,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
    textAlign: "left",
    fontWeight: "500",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryUltraLight,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  durationIcon: {
    marginRight: 8,
  },
  durationText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  // Completed badge
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success + "20",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  completedText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: "700",
    marginLeft: 8,
  },
  // Exercise controls
  exerciseControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  controlButton: {
    alignItems: "center",
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlButtonIcon: {
    marginBottom: 8,
  },
  controlButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  controlButtonTextDisabled: {
    color: colors.onSurfaceMuted,
  },
  mainControlButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: -70,
  },
  mainControlGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  mainControlButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },
  // Vertical scroll styles for exercise content
  exerciseVerticalScroll: {
    flex: 1,
  },
  exerciseVerticalScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  exerciseBottomPadding: {
    height: 40,
  },
  // New styles for media display
  exerciseImage: {
    width: "100%",
    height: 200, // Adjust height as needed
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: colors.surfaceVariant, // Placeholder background
  },
  videoContainer: {
    width: "100%",
    height: 200, // Adjust height as needed
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  exerciseVideo: {
    width: "100%",
    height: "100%",
  },
  videoPlayButton: {
    position: "absolute",
    zIndex: 1,
  },
  noMediaContainer: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.onSurfaceMuted + "30",
    borderStyle: "dashed",
  },
  noMediaText: {
    fontSize: 16,
    color: colors.onSurfaceMuted,
    marginTop: 10,
    fontWeight: "600",
  },
})
