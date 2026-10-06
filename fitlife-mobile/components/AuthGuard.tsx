"use client"

import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { selectIsAuthenticated, selectIsLoading } from "@/redux/slices/authSlice"
import type React from "react"
import { ActivityIndicator } from "react-native"
import { useSelector } from "react-redux"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isLoading = useSelector(selectIsLoading)

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    )
  }

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}
