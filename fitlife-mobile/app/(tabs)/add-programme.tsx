"use client"
import React, { useState } from "react"
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
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

const API_URL = "http://192.168.1.8:5000/api/programme/generate"
const USER_PROFILE_URL = "http://192.168.1.8:5000/api/auth/getprofile"
const UPDATE_PROFILE_URL = "http://192.168.1.8:5000/api/auth/updateprofile"

// Questions configuration
const questions = [
  {
    id: 1,
    title: "What's your fitness goal/target?",
    options: [
      { id: "weight_loss", label: "I wanna lose weight", icon: "scale-outline", color: "#6B7280" },
      { id: "muscle_gain", label: "I wanna get bulks", icon: "barbell-outline", color: "#6B7280" },
      { id: "toning", label: "I wanna get toned", icon: "fitness-outline", color: "#6B7280" },
      { id: "endurance", label: "I wanna gain endurance", icon: "walk-outline", color: "#6B7280" },
      { id: "ai_coach", label: "I wanna try AI Coach", icon: "sparkles-outline", color: "#F97316" },
      { id: "trying_app", label: "Just trying out the app! 😊", icon: "happy-outline", color: "#6B7280" },
    ],
  },
  {
    id: 2,
    title: "What's your current fitness level?",
    options: [
      { id: "beginner", label: "Complete beginner", icon: "play-outline", color: "#6B7280" },
      { id: "some_experience", label: "Some experience", icon: "trending-up-outline", color: "#6B7280" },
      { id: "intermediate", label: "Intermediate", icon: "medal-outline", color: "#6B7280" },
      { id: "advanced", label: "Advanced athlete", icon: "trophy-outline", color: "#6B7280" },
      { id: "professional", label: "Professional/Competitive", icon: "star-outline", color: "#6B7280" },
    ],
  },
  {
    id: 3,
    title: "How many days per week can you workout?",
    options: [
      { id: "1-2", label: "1-2 days (Weekend warrior)", icon: "calendar-outline", color: "#6B7280" },
      { id: "3-4", label: "3-4 days (Balanced approach)", icon: "calendar-outline", color: "#6B7280" },
      { id: "5-6", label: "5-6 days (Very committed)", icon: "calendar-outline", color: "#6B7280" },
      { id: "daily", label: "Every day (Fitness enthusiast)", icon: "flame-outline", color: "#6B7280" },
    ],
  },
  {
    id: 4,
    title: "How long do you prefer to workout?",
    options: [
      { id: "15-30", label: "15-30 minutes (Quick sessions)", icon: "time-outline", color: "#6B7280" },
      { id: "30-45", label: "30-45 minutes (Standard)", icon: "time-outline", color: "#6B7280" },
      { id: "45-60", label: "45-60 minutes (Extended)", icon: "time-outline", color: "#6B7280" },
      { id: "60+", label: "60+ minutes (Marathon sessions)", icon: "hourglass-outline", color: "#6B7280" },
    ],
  },
  {
    id: 5,
    title: "What equipment do you have access to?",
    options: [
      { id: "none", label: "No equipment (Bodyweight only)", icon: "body-outline", color: "#6B7280" },
      { id: "basic", label: "Basic (Dumbbells, mat)", icon: "barbell-outline", color: "#6B7280" },
      { id: "home_gym", label: "Home gym setup", icon: "home-outline", color: "#6B7280" },
      { id: "full_gym", label: "Full gym access", icon: "business-outline", color: "#6B7280" },
    ],
  },
  {
    id: 6,
    title: "What's your main motivation?",
    options: [
      { id: "health", label: "Better health & wellness", icon: "heart-outline", color: "#6B7280" },
      { id: "appearance", label: "Look better & feel confident", icon: "eye-outline", color: "#6B7280" },
      { id: "strength", label: "Get stronger & more powerful", icon: "flash-outline", color: "#6B7280" },
      { id: "sport", label: "Improve sports performance", icon: "football-outline", color: "#6B7280" },
      { id: "lifestyle", label: "Active lifestyle", icon: "leaf-outline", color: "#6B7280" },
    ],
  },
]

const AddProgrammScreen = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isGoalFromProfile, setIsGoalFromProfile] = useState(false)
  const [originalProfileGoal, setOriginalProfileGoal] = useState<string>("")
  const insets = useSafeAreaInsets()

  const currentQuestion = questions.find((q) => q.id === currentStep)
  const totalSteps = questions.length

  // Mapping functions
  const getGoalMapping = () => ({
    weight_loss: "weight loss",
    muscle_gain: "muscle gain",
    toning: "toning",
    endurance: "toning", // fallback
    ai_coach: "toning", // fallback
    trying_app: "toning", // fallback
  })

  const getReverseGoalMapping = () => ({
    "weight loss": "weight_loss",
    "muscle gain": "muscle_gain",
    toning: "toning",
  })

  // Function to update user profile objective (appelée seulement lors de la création du programme)
  const updateUserObjective = async (newObjectiveId: string) => {
    try {
      const token = await AsyncStorage.getItem("authToken")
      if (!token) return false

      const goalMapping = getGoalMapping()
      const newObjective = goalMapping[newObjectiveId as keyof typeof goalMapping]

      const response = await fetch(UPDATE_PROFILE_URL, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          objectif: newObjective,
        }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUserProfile(updatedUser.user)
        console.log("Profile objective updated successfully:", newObjective)
        return true
      } else {
        console.log("Failed to update profile objective")
        return false
      }
    } catch (error) {
      console.error("Error updating profile objective:", error)
      return false
    }
  }

  // Function to fetch user profile
  const fetchUserProfile = async () => {
    try {
      setLoadingProfile(true)
      const token = await AsyncStorage.getItem("authToken")
      if (!token) {
        console.log("No token found")
        return
      }

      const response = await fetch(USER_PROFILE_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUserProfile(userData)
        console.log("User profile loaded:", userData)

        // Map profile objective to assessment format
        if (userData.objectif) {
          const reverseGoalMapping = getReverseGoalMapping()
          const mappedGoal = reverseGoalMapping[userData.objectif.toLowerCase() as keyof typeof reverseGoalMapping]
          console.log("Mapping goal:", userData.objectif, "->", mappedGoal)
          if (mappedGoal) {
            setAnswers((prev) => ({ ...prev, 1: mappedGoal }))
            setIsGoalFromProfile(true)
            setOriginalProfileGoal(mappedGoal)
            console.log("Goal auto-selected:", mappedGoal)
          }
        }
      } else {
        console.log("Failed to fetch user profile")
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setLoadingProfile(false)
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      setCurrentStep(1)
      setAnswers({})
      setIsGoalFromProfile(false)
      setOriginalProfileGoal("")
      fetchUserProfile()
      return () => {}
    }, []),
  )

  const handleOptionSelect = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [currentStep]: optionId }))
    // Si c'est la première question (objectif), gérer l'affichage du badge
    if (currentStep === 1) {
      // Vérifier si l'objectif sélectionné correspond à celui du profil original
      setIsGoalFromProfile(optionId === originalProfileGoal)
    }
  }

  const handleNext = () => {
    if (!answers[currentStep]) {
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
      router.replace("/trainings")
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const token = await AsyncStorage.getItem("authToken")

      // Vérifier si l'objectif a changé par rapport au profil original
      const selectedGoal = answers[1]
      const goalHasChanged = selectedGoal !== originalProfileGoal

      // Si l'objectif a changé, le mettre à jour dans le profil AVANT de créer le programme
      if (goalHasChanged && selectedGoal) {
        console.log("Goal has changed, updating profile before creating program...")
        const updateSuccess = await updateUserObjective(selectedGoal)
        if (!updateSuccess) {
          Alert.alert("Warning", "Failed to update your profile, but the program will still be created.")
        }
      }

      // Map answers to API format
      const goalMapping = getGoalMapping()
      const levelMapping: Record<string, string> = {
        beginner: "beginner",
        some_experience: "beginner",
        intermediate: "intermediate",
        advanced: "advanced",
        professional: "advanced",
      }
      const equipmentMapping: Record<string, string[]> = {
        none: ["Bodyweight"],
        basic: ["Dumbbells", "Mat"],
        home_gym: ["Dumbbells", "Mat", "Bench"],
        full_gym: ["Dumbbells", "Mat", "Bench", "Barbell"],
      }

      // Extract frequency and duration directly from answers
      const frequency = answers[3] || "3-4" // Default if not selected
      const duration = answers[4] || "30-45" // Default if not selected

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          objectif: goalMapping[answers[1] as keyof typeof goalMapping] || "toning",
          niveau: levelMapping[answers[2]] || "beginner",
          materiel: equipmentMapping[answers[5] as keyof typeof equipmentMapping] || ["Bodyweight"],
          frequency: frequency, // Pass frequency
          duration: duration, // Pass duration
          motivation: answers[6] || "health",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error creating the program")
      }

      Alert.alert("Success", "Your personalized workout program has been created!")
      router.replace("/trainings")
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>Loading ...</Text>
      </View>
    )
  }

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
            <Text style={styles.headerTitle}>Assessment</Text>
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
          {/* Question */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionTitle}>{currentQuestion?.title}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion?.options.map((option) => {
              const isSelected = answers[currentStep] === option.id
              const isFromProfile = currentStep === 1 && isGoalFromProfile && isSelected
              const goalHasChanged = currentStep === 1 && isSelected && !isFromProfile && originalProfileGoal !== ""
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
                        {isFromProfile && (
                          <Text style={styles.profileBadge}>You've chosen a goal — feel free to update it!</Text>
                        )}
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
            style={[styles.continueButton, !answers[currentStep] && styles.continueButtonDisabled]}
            onPress={handleNext}
            disabled={!answers[currentStep] || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingSpinner} />
            ) : (
              <>
                <Text style={styles.continueButtonText}>
                  {currentStep === totalSteps ? "Create Program" : "Continue"}
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
  profileBadge: {
    fontSize: 12,
    color: "#1F2937",
    fontWeight: "500",
    marginTop: 2,
    fontStyle: "italic",
  },
  changedBadge: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "500",
    marginTop: 2,
    fontStyle: "italic",
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
    marginBottom: 70,
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

export default AddProgrammScreen
