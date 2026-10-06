import { ThemedText } from "@/components/ThemedText";
import { authService } from "@/services/authService";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const msg = await authService.forgotPassword(email);
      setMessage(msg);
      setLoading(false);
      setRedirecting(true);
      setTimeout(() => {
        router.replace("/auth/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <ThemedText style={styles.title}>Forgot Password</ThemedText>
        <ThemedText style={styles.subtitle}>
          Enter your email address to receive a password reset link.
        </ThemedText>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Email"
            placeholderTextColor="#888"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading && !redirecting}
          />
        </View>
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        {message ? <ThemedText style={styles.success}>{message}</ThemedText> : null}
        <TouchableOpacity
          style={[styles.button, (loading || redirecting) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !email || redirecting}
        >
          {loading || redirecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Send Reset Email</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF6F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  textInput: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  button: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  error: {
    color: '#d32f2f',
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  success: {
    color: '#22bb33',
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
}); 