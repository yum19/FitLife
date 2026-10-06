"use client"

import { useEffect, useState } from "react"
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import {API_URL} from '../../constants/Config';
// Définition du type Coach selon ton modèle User
interface Coach {
  _id: string
  nom: string
  prenom: string
  email: string
  age: number
  sexe: string
  certifications: string[]
  specialites: string[]
  disponible?: boolean
}

export default function CoachsScreen() {
  const [coachs, setCoachs] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get<Coach[]>(`${API_URL}/users/coachs`)
      .then((res) => {
        setCoachs(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des coachs :", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    )
  }

  const renderCoachItem = ({ item }: { item: Coach }) => (
    <TouchableOpacity style={styles.coachCard}>
      <View style={styles.coachImageContainer}>
        <Image source={{ uri: "/placeholder.svg?height=60&width=60" }} style={styles.coachImage} />
      </View>
      <View style={styles.coachInfo}>
        <Text style={styles.coachName}>
          {item.nom} {item.prenom}
        </Text>
        <Text style={styles.coachDetail}>{item.specialites.length} Spécialités</Text>
        <Text style={styles.coachSubDetail}>{item.disponible ? "Disponible maintenant" : "Non disponible"}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Coachs</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalText}>{coachs.length} Total</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Trouvez le coach parfait pour atteindre vos objectifs. Entraînez-vous avec des professionnels certifiés.
          </Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tous les Coachs</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Voir Tout</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={coachs}
          keyExtractor={(item) => item._id}
          renderItem={renderCoachItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#2c3e50",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    marginTop: 20,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  totalBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  totalText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    lineHeight: 22,
    marginTop: 5,
  },
  content: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -20,
    paddingTop: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  seeAllText: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600",
  },
  listContainer: {
    paddingBottom: 20,
  },
  coachCard: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  coachImageContainer: {
    marginRight: 16,
  },
  coachImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#e9ecef",
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  coachDetail: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 2,
  },
  coachSubDetail: {
    fontSize: 12,
    color: "#6c757d",
  },
})
