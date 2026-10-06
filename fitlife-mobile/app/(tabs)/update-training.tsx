"use client"
import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import React from "react"

const API_BASE_URL = "http://192.168.1.8:5000/api/programme"

// Questions sans l'objectif (qui sera affiché en read-only en haut)
const updateQuestions = [
  {
    id: 1,
    title: "What's your current fitness level?",
    subtitle: "Update your experience level",
    options: [
      { id: "beginner", label: "Complete beginner", icon: "play-outline", color: "#6B7280" },
      { id: "some_experience", label: "Some experience", icon: "trending-up-outline", color: "#6B7280" },
      { id: "intermediate", label: "Intermediate", icon: "medal-outline", color: "#6B7280" },
      { id: "advanced", label: "Advanced athlete", icon: "trophy-outline", color: "#6B7280" },
      { id: "professional", label: "Professional/Competitive", icon: "star-outline", color: "#6B7280" },
    ],
  },
  {
    id: 2,
    title: "How many days per week can you workout?",
    subtitle: "Update your workout frequency",
    options: [
      { id: "1-2", label: "1-2 days (Weekend warrior)", icon: "calendar-outline", color: "#6B7280" },
      { id: "3-4", label: "3-4 days (Balanced approach)", icon: "calendar-outline", color: "#6B7280" },
      { id: "5-6", label: "5-6 days (Very committed)", icon: "calendar-outline", color: "#6B7280" },
      { id: "daily", label: "Every day (Fitness enthusiast)", icon: "flame-outline", color: "#6B7280" },
    ],
  },
  {
    id: 3,
    title: "How long do you prefer to workout?",
    subtitle: "Update your session duration",
    options: [
      { id: "15-30", label: "15-30 minutes (Quick sessions)", icon: "time-outline", color: "#6B7280" },
      { id: "30-45", label: "30-45 minutes (Standard)", icon: "time-outline", color: "#6B7280" },
      { id: "45-60", label: "45-60 minutes (Extended)", icon: "time-outline", color: "#6B7280" },
      { id: "60+", label: "60+ minutes (Marathon sessions)", icon: "hourglass-outline", color: "#6B7280" },
    ],
  },
  {
    id: 4,
    title: "What equipment do you have access to?",
    subtitle: "Update your available equipment",
    options: [
      { id: "none", label: "No equipment (Bodyweight only)", icon: "body-outline", color: "#6B7280" },
      { id: "basic", label: "Basic (Dumbbells, mat)", icon: "barbell-outline", color: "#6B7280" },
      { id: "home_gym", label: "Home gym setup", icon: "home-outline", color: "#6B7280" },
      { id: "full_gym", label: "Full gym access", icon: "business-outline", color: "#6B7280" },
    ],
  },
  {
    id: 5,
    title: "What's your main motivation?",
    subtitle: "Update your primary motivation",
    options: [
      { id: "health", label: "Better health & wellness", icon: "heart-outline", color: "#6B7280" },
      { id: "appearance", label: "Look better & feel confident", icon: "eye-outline", color: "#6B7280" },
      { id: "strength", label: "Get stronger & more powerful", icon: "flash-outline", color: "#6B7280" },
      { id: "sport", label: "Improve sports performance", icon: "football-outline", color: "#6B7280" },
      { id: "lifestyle", label: "Active lifestyle", icon: "leaf-outline", color: "#6B7280" },
    ],
  },
]

// Options d'objectifs pour l'affichage read-only
const goalOptions = [
  { id: "weight_loss", label: "I wanna lose weight", icon: "scale-outline", color: "#6B7280" },
  { id: "muscle_gain", label: "I wanna get bulks", icon: "barbell-outline", color: "#6B7280" },
  { id: "toning", label: "I wanna get toned", icon: "fitness-outline", color: "#6B7280" },
  { id: "endurance", label: "I wanna gain endurance", icon: "walk-outline", color: "#6B7280" },
  { id: "ai_coach", label: "I wanna try AI Coach", icon: "sparkles-outline", color: "#FF5722" },
  { id: "trying_app", label: "Just trying out the app! 😊", icon: "happy-outline", color: "#6B7280" },
]

const UpdateProgrammeScreen = () => {
  const { programmeId } = useLocalSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentGoal, setCurrentGoal] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const insets = useSafeAreaInsets()

  const currentQuestion = updateQuestions.find((q) => q.id === currentStep)
  const totalSteps = updateQuestions.length

  // Mapping functions
  const getGoalMapping = () => ({
    weight_loss: "weight loss",
    muscle_gain: "muscle gain",
    toning: "toning",
    endurance: "toning",
    ai_coach: "toning",
    trying_app: "toning",
  })

  const getReverseGoalMapping = () => ({
    "weight loss": "weight_loss",
    "muscle gain": "muscle_gain",
    toning: "toning",
    "better health and wellness": "weight_loss", // Default mapping
  })

  const getLevelMapping = () => ({
    beginner: "beginner",
    some_experience: "beginner",
    intermediate: "intermediate",
    advanced: "advanced",
    professional: "advanced",
  })

  const getReverseLevelMapping = () => ({
    beginner: "beginner",
    intermediate: "intermediate",
    advanced: "advanced",
    expert: "advanced", // Added expert level mapping
  })

  const getEquipmentMapping = () => ({
    none: ["Bodyweight"],
    basic: ["Dumbbells", "Mat"],
    home_gym: ["Dumbbells", "Mat", "Bench"],
    full_gym: ["Dumbbells", "Mat", "Bench", "Barbell"],
  })

  const getReverseEquipmentMapping = (equipmentArray: string[]) => {
    if (!equipmentArray || equipmentArray.length === 0) return "none"

    // Sort the array to ensure consistent comparison
    const sortedEquipment = [...equipmentArray].sort()
    const equipmentString = sortedEquipment.join(",")

    // Check for exact matches first
    if (sortedEquipment.includes("Barbell")) return "full_gym"
    if (sortedEquipment.includes("Bench")) return "home_gym"
    if (sortedEquipment.includes("Dumbbells") || sortedEquipment.includes("Mat")) return "basic"
    if (sortedEquipment.includes("Bodyweight") || equipmentString.toLowerCase().includes("bodyweight")) return "none"

    // Default fallback
    return "none"
  }

  const fetchProgramme = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/${programmeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      console.log("Raw programme data from API:", data)

      const reverseGoalMapping = getReverseGoalMapping()
      const reverseLevelMapping = getReverseLevelMapping()

      // Map goal with case-insensitive matching and better fallbacks
      const rawGoal = data.objectif?.toLowerCase() || ""
      console.log("Raw goal from API:", rawGoal)

      let mappedGoal = "toning" // default
      for (const [key, value] of Object.entries(reverseGoalMapping)) {
        if (key.toLowerCase() === rawGoal) {
          mappedGoal = value
          break
        }
      }
      setCurrentGoal(mappedGoal)
      console.log("Mapped goal:", mappedGoal)

      // Map level with case-insensitive matching
      const rawLevel = data.niveau?.toLowerCase() || ""
      console.log("Raw level from API:", rawLevel)

      let mappedLevel = "beginner" // default
      for (const [key, value] of Object.entries(reverseLevelMapping)) {
        if (key.toLowerCase() === rawLevel) {
          mappedLevel = value
          break
        }
      }
      console.log("Mapped level:", mappedLevel)

      console.log("Raw equipment from API:", data.materiel)
      const mappedEquipment = getReverseEquipmentMapping(data.materiel || [])
      console.log("Mapped equipment:", mappedEquipment)

      const newAnswers = {
        1: mappedLevel,
        2: data.frequency || "3-4",
        3: data.duration || "30-45",
        4: mappedEquipment,
        5: data.motivation || "health",
      }

      setAnswers(newAnswers)
      console.log("Final mapped answers:", newAnswers)
    } catch (err) {
      console.error("Error loading programme:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      Alert.alert("Error", `Failed to load program details: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      // Only reset step and updating state, keep answers until new data is loaded
      setCurrentStep(1)
      setUpdating(false)

      // Load programme data
      fetchProgramme()

      return () => {
        // Cleanup if needed
      }
    }, [programmeId]),
  )

  const handleOptionSelect = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [currentStep]: optionId }))
  }

  const handleNext = () => {
    const currentAnswer = answers[currentStep]

    if (!currentAnswer || currentAnswer === "") {
      Alert.alert("Selection Required", "Please select an option to continue.")
      return
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      router.replace("/training-detail")
    }
  }

  const handleSubmit = async () => {
    setUpdating(true)
    try {
      const token = await AsyncStorage.getItem("authToken")

      // Map answers back to API format
      const goalMapping = getGoalMapping()
      const levelMapping = getLevelMapping()
      const equipmentMapping = getEquipmentMapping()

      const submitData = {
        objectif: goalMapping[currentGoal as keyof typeof goalMapping] || "toning",
        niveau: levelMapping[answers[1] as keyof typeof levelMapping] || "beginner",
        materiel: equipmentMapping[answers[4] as keyof typeof equipmentMapping] || ["Bodyweight"],
        frequency: answers[2] || "3-4",
        duration: answers[3] || "30-45",
        motivation: answers[5] || "health",
      }

      console.log("Submitting programme update:", submitData)

      const response = await fetch(`${API_BASE_URL}/${programmeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Error updating the program")
      }

      Alert.alert("Success", "Program updated successfully!")

      router.replace("/trainings")
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong. Please try again.")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>Loading program details...</Text>
      </View>
    )
  }

  // Trouver l'option d'objectif actuel pour l'affichage
  const currentGoalOption = goalOptions.find((option) => option.id === currentGoal)

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Update Program</Text>
          </View>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>
              {currentStep} of {totalSteps}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Goal Display (Read-only) */}
          <View style={styles.currentGoalContainer}>
            <Text style={styles.currentGoalTitle}>Your Current Goal</Text>
            <View style={styles.currentGoalCard}>
              <View style={styles.currentGoalContent}>
                <View style={styles.currentGoalLeft}>
                  <View style={styles.currentGoalIconContainer}>
                    <Ionicons name={currentGoalOption?.icon as any} size={20} color="#FF5722" />
                  </View>
                  <View style={styles.currentGoalTextContainer}>
                    <Text style={styles.currentGoalText}>{currentGoalOption?.label || "Goal not found"}</Text>
                    <Text style={styles.currentGoalBadge}>Cannot be changed</Text>
                  </View>
                </View>
                <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
              </View>
            </View>
          </View>

          {/* Question */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionTitle}>{currentQuestion?.title}</Text>
            {currentQuestion?.subtitle && <Text style={styles.questionSubtitle}>{currentQuestion.subtitle}</Text>}
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion?.options.map((option) => {
              const isSelected = answers[currentStep] === option.id

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleOptionSelect(option.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionLeft}>
                      <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                        <Ionicons name={option.icon as any} size={20} color={isSelected ? "#FFFFFF" : option.color} />
                      </View>
                      <View style={styles.optionTextContainer}>
                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.label}</Text>
                      </View>
                    </View>
                    <View style={styles.radioContainer}>
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={[styles.continueButton, (!answers[currentStep] || updating) && styles.continueButtonDisabled]}
            onPress={handleNext}
            disabled={!answers[currentStep] || updating}
            activeOpacity={0.8}
          >
            {updating ? (
              <View style={styles.loadingSpinner} />
            ) : (
              <>
                <Text style={styles.continueButtonText}>
                  {currentStep === totalSteps ? "Save Changes" : "Continue"}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingSpinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#F97316",
    borderTopColor: "transparent",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#F9FAFB",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  stepIndicator: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stepText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  // Current Goal (Read-only)
  currentGoalContainer: {
    marginBottom: 32,
  },
  currentGoalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  currentGoalCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  currentGoalContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currentGoalLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  currentGoalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  currentGoalTextContainer: {
    flex: 1,
  },
  currentGoalText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    lineHeight: 22,
  },
  currentGoalBadge: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 2,
    fontStyle: "italic",
  },
  // Question
  questionContainer: {
    marginBottom: 32,
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    lineHeight: 36,
    textAlign: "left",
  },
  questionSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 8,
    lineHeight: 24,
  },
  // Options
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardSelected: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
    shadowColor: "#F97316",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconContainerSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    lineHeight: 22,
  },
  optionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  // Radio Button
  radioContainer: {
    marginLeft: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#FFFFFF",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  // Button
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "#F9FAFB",
    marginBottom: 50,
  },
  continueButton: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.05,
    elevation: 2,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
})

export default UpdateProgrammeScreen
