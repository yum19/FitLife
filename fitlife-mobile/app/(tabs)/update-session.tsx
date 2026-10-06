"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useLocalSearchParams, router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"


const API_URL = "http://192.168.7.5:5000/api/seances"


// Palette de couleurs cohérente
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

// Header simple
const SimpleHeader = () => (
  <View style={styles.header}>
    <View style={styles.headerContent}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/trainings")} activeOpacity={0.8}>
        <View style={styles.backButtonContent}>
          <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
        </View>
      </TouchableOpacity>

      <View style={styles.headerTextContainer}>
        <View style={styles.titleContainer}>
          <LinearGradient
            colors={colors.gradient.primary}
            style={styles.titleAccent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.headerTitle}>Update Session</Text>
        </View>
        <Text style={styles.headerSubtitle}>Reschedule your workout session</Text>
      </View>
    </View>
  </View>
)

// Composant Loading
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingContent}>
      <LinearGradient colors={colors.gradient.primary} style={styles.loadingIcon}>
        <ActivityIndicator size="large" color={colors.surface} />
      </LinearGradient>
      <Text style={styles.loadingText}>Loading session details</Text>
    </View>
  </View>
)

// Composant Date Selector
const DateSelector = ({
  date,
  onPress,
  loading,
}: {
  date: Date | null
  onPress: () => void
  loading: boolean
}) => (
  <View style={styles.dateSection}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Session Date</Text>
      <Text style={styles.sectionSubtitle}>Choose when you want to workout</Text>
    </View>

    <TouchableOpacity
      style={[styles.dateSelector, loading && styles.dateSelectorDisabled]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      <View style={styles.dateSelectorContent}>
        <LinearGradient colors={colors.gradient.primary} style={styles.dateIcon}>
          <Ionicons name="calendar" size={20} color={colors.surface} />
        </LinearGradient>

        <View style={styles.dateTextContainer}>
          <Text style={styles.dateLabel}>Selected Date</Text>
          <Text style={styles.dateValue}>
            {date
              ? date.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Loading..."}
          </Text>
        </View>

        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
        </View>
      </View>
    </TouchableOpacity>
  </View>
)

export default function UpdateSessionScreen() {
  const { seanceId } = useLocalSearchParams()
  const [date, setDate] = useState<Date | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    const fetchSeance = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken")
        const res = await fetch(`${API_URL}/${seanceId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const contentType = res.headers.get("content-type")
        if (!res.ok) {
          const errMsg = contentType?.includes("application/json") ? await res.json() : await res.text()
          console.log("Server error:", errMsg)
          throw new Error("Failed to fetch session")
        }
        const data = await res.json()
        setDate(new Date(data.date))
      } catch (error) {
        console.log("fetchSeance error:", (error as Error).message)
        Alert.alert("Error", "Failed to load session details.")
      } finally {
        setLoading(false)
      }
    }

    fetchSeance()
  }, [seanceId])

  const onChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === "ios")
    if (selectedDate) {
      setDate(selectedDate)
    }
  }

  const handleUpdate = async () => {
    if (!date) return Alert.alert("Error", "Please select a date.")

    setUpdating(true)
    try {
      const token = await AsyncStorage.getItem("authToken")
      const res = await fetch(`${API_URL}/${seanceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date: date.toISOString() }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        console.log("Server error:", errorData)
        throw new Error("Failed to update session")
      }

      Alert.alert("Success", "Session date updated successfully!")
      router.replace("/trainings")
    } catch (error) {
      Alert.alert("Error", "Failed to update the session date. Please try again.")
      console.log("handleUpdate error:", (error as Error).message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <LoadingScreen />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SimpleHeader />

        <DateSelector date={date} onPress={() => setShowPicker(true)} loading={loading} />

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardContent}>
            <View style={styles.infoHeader}>
              <LinearGradient colors={colors.gradient.secondary} style={styles.infoIcon}>
                <Ionicons name="information-circle" size={20} color={colors.surface} />
              </LinearGradient>
              <Text style={styles.infoTitle}>Important Note</Text>
            </View>
            <Text style={styles.infoText}>
              You can only schedule sessions for future dates. Make sure to choose a date that works with your schedule.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showPicker && date && (
        <DateTimePicker value={date} mode="date" display="default" onChange={onChange} minimumDate={new Date()} />
      )}

      {/* Fixed Button */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[styles.updateButton, (updating || !date) && styles.updateButtonDisabled]}
          onPress={handleUpdate}
          disabled={updating || !date}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={updating || !date ? [colors.onSurfaceLight, colors.onSurfaceMuted] : colors.gradient.primary}
            style={styles.updateButtonGradient}
          >
            {updating ? (
              <>
                <ActivityIndicator size="small" color={colors.surface} />
                <Text style={styles.updateButtonText}>Updating Session...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.surface} />
                <Text style={styles.updateButtonText}>Update Session Date</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
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

  // Header
  header: {
    marginBottom: 32,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 16,
  },
  backButtonContent: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  titleAccent: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
    marginLeft: 16,
  },

  // Date Section
  dateSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
    marginTop: 4,
  },
  dateSelector: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dateSelectorDisabled: {
    opacity: 0.6,
  },
  dateSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  dateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    fontWeight: "600",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    color: colors.onSurface,
    fontWeight: "700",
  },
  chevronContainer: {
    marginLeft: 12,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  infoCardContent: {
    padding: 20,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.onSurface,
  },
  infoText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
    lineHeight: 20,
  },

  // Fixed Button
  fixedButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
  },
  updateButton: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom:120
  },
  updateButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  updateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  updateButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.surface,
  },
})
