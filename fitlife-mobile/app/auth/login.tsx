"use client"
import { ThemedText } from "@/components/ThemedText"
import { CustomAlert } from "@/components/ui/CustomAlert"
import { login, selectAuthError, selectIsLoading } from "@/redux/slices/authSlice"
import type { AppDispatch } from "@/redux/store"
import { RootState } from "@/redux/store"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native"
import { useDispatch, useSelector } from "react-redux"

export const options = { headerShown: false };

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState<string | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState("");
  const dispatch = useDispatch<AppDispatch>()
  const isLoading = useSelector(selectIsLoading)
  const error = useSelector(selectAuthError)
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertTitle("Error");
      setAlertMessage("Please fill in all fields");
      setAlertVisible(true);
      return;
    }
    try {
      const result = await dispatch(login({ email, motDePasse: password }))
      let userRole: string | undefined = undefined;
      if (result && result.payload && typeof result.payload === 'object' && 'user' in result.payload) {
        userRole = (result.payload as any).user?.role;
      } else {
        userRole = user?.role;
      }
      if (userRole === "admin") {
        setAlertTitle("Access Denied");
        setAlertMessage("Admins do not have the right to login here.");
        setAlertVisible(true);
        return;
      }
      router.replace("/(tabs)")
    } catch (error: any) {
      setAlertTitle("Login Failed");
      setAlertMessage(error.message || "An error occurred");
      setAlertVisible(true);
    }
  }

  const navigateToRegister = () => {
    router.push("/auth/register")
  }

  const handleSocialLogin = (platform: string) => {
    Alert.alert("Coming Soon", `${platform} login will be available soon!`)
  }

  const handleForgotPassword = () => {
    router.push("/auth/forgot-password");
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ImageBackground
          source={require('../../assets/images/bg1.jpeg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.overlay}>
              {/* App logo */}

              {/* Title and Subtitle */}
              <ThemedText style={styles.title}>Sign In To FitLife</ThemedText>
              <ThemedText style={styles.subtitle}>Let's personalize your fitness journey</ThemedText>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Password</ThemedText>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                </View>
              )}

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.signInButton, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <ThemedText style={styles.signInButtonText}>{isLoading ? "Signing In..." : "Sign In"}</ThemedText>
                {!isLoading && <Ionicons name="arrow-forward" size={20} color="white" />}
              </TouchableOpacity>

              {/* Social Media Icons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin("Instagram")}>
                  <Ionicons name="logo-google" size={24} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin("Facebook")}>
                  <Ionicons name="logo-facebook" size={24} color="#666" />
                </TouchableOpacity>
               
              </View>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <ThemedText style={styles.signUpText}>Don't have an account? </ThemedText>
                <TouchableOpacity onPress={navigateToRegister}>
                  <ThemedText style={styles.signUpLink}>Sign Up</ThemedText>
                </TouchableOpacity>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPasswordContainer} onPress={handleForgotPassword}>
                <ThemedText style={styles.forgotPasswordText}>Forgot Password</ThemedText>
              </TouchableOpacity>

              {/* Bottom Indicator */}
            </View>
          </ScrollView>
        </ImageBackground>
        <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  
  title: {
    paddingTop: 20,
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    paddingBottom: 20,
  },
  subtitle: {
    paddingTop: 20,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
  },
  eyeIcon: {
    padding: 4,
  },
  errorContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
    fontWeight: "500",
  },
  signInButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    width: 48,
    height: 48,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  signUpText: {
    fontSize: 16,
    color: "#666",
  },
  signUpLink: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600",
  },
  forgotPasswordContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600",
  },
  bottomIndicator: {
    width: 134,
    height: 5,
    backgroundColor: "#1a1a1a",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: "auto",
  },
})
