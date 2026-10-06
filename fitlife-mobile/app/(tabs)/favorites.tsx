// frontend/app/(tabs)/FavoritesScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions, ActivityIndicator, Alert } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";
import { Produit } from "@/services/ProductService";

const { width } = Dimensions.get("window");

const FavoritesScreen = () => {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const [favorites, setFavorites] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!token || !user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      console.log('Fetching favorites for user:', user._id);
      
      const response = await fetch(`http://192.168.1.3:5000/api/favorites/${user._id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          dispatch(logout());
          navigation.navigate("auth/login" as never);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Favorites API response:", data);
      
      if (data.success) {
        // Check if backend already returns products
        if (data.products && data.products.length > 0) {
          console.log("Backend returned products directly:", data.products.length);
          setFavorites(data.products);
        } 
        // If backend only returns favorite IDs, fetch products separately
        else if (data.favorites && data.favorites.length > 0) {
          console.log("Fetching products for favorite IDs:", data.favorites);
          
          try {
            const productResponse = await fetch("http://192.168.1.3:5000/api/products/by-ids", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ids: data.favorites }),
            });
            
            if (!productResponse.ok) {
              throw new Error(`Failed to fetch products: ${productResponse.status}`);
            }
            
            const productData = await productResponse.json();
            console.log("Products API response:", productData);
            
            if (productData.success && productData.products) {
              console.log("Setting favorites with products:", productData.products.length);
              setFavorites(productData.products);
            } else {
              console.log("No products found in response");
              setFavorites([]);
            }
          } catch (productError) {
            console.error("Error fetching products:", productError);
            // Fallback: still show something even if product fetch fails
            setFavorites([]);
            Alert.alert("Warning", "Could not load product details for favorites");
          }
        } else {
          console.log("No favorites found for user");
          setFavorites([]);
        }
      } else {
        console.error("API error:", data.message);
        setFavorites([]);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      Alert.alert("Error", "Failed to load favorites. Please try again.");
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [token, user, dispatch, navigation]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  const toggleFavorite = async (produitId: string) => {
    if (!token || !user) {
      Alert.alert("Login Required", "Please login to manage favorites.", [
        { text: "OK", style: "default" },
        { text: "Login", onPress: () => navigation.navigate("auth/login" as never) }
      ]);
      return;
    }

    try {
      const response = await fetch("http://192.168.1.3:5000/api/favorites/toggle", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          favoriId: produitId, // Send as string since MongoDB _id is a string
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          dispatch(logout());
          navigation.navigate("auth/login" as never);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh favorites after toggle
        await fetchFavorites();
        Alert.alert("Success", data.message);
      } else {
        Alert.alert("Error", data.message || "Failed to update favorite");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to toggle favorite");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("product" as never)} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.headerRight}>
          {favorites.length > 0 && (
            <Text style={styles.itemCount}>{favorites.length} items</Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {favorites.length === 0 ? (
          <View style={styles.noFavoritesContainer}>
            <Icon name="heart-outline" size={80} color="#ccc" />
            <Text style={styles.noFavoritesTitle}>No Favorites</Text>
            <Text style={styles.noFavoritesText}>Add products to your favorites to see them here!</Text>
            <TouchableOpacity
              style={styles.shopNowButton}
              onPress={() => navigation.navigate("product" as never)}
            >
              <Text style={styles.shopNowText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productsContainer}>
            {favorites.map((produit) => (
              <View key={produit._id} style={styles.productWrapper}>
                <TouchableOpacity
                  style={styles.productCard}
                  onPress={() => navigation.navigate("ProductDetail", { product: produit, fromCart: false })}
                >
                  <TouchableOpacity
                    style={styles.likeButton}
                    onPress={() => toggleFavorite(produit._id)}
                  >
                    <Icon name="heart" size={24} color="#F97316" />
                  </TouchableOpacity>
                  <Image
                    source={{ uri: produit.image }}
                    style={styles.productImage}
                    onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
                  />
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>50% OFF</Text>
                  </View>
                  <Text style={styles.productName}>{produit.nom}</Text>
                  <Text style={styles.productPrice}>
                    {`$${produit.prix}`} <Text style={styles.originalPrice}>${produit.prix + 50}</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  itemCount: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  scrollContainer: { flex: 1 },
  noFavoritesContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  noFavoritesTitle: { fontSize: 24, fontWeight: "bold", color: "#333", marginTop: 20, marginBottom: 10 },
  noFavoritesText: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 20 },
  shopNowButton: {
    backgroundColor: "#F97316",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  shopNowText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  productsContainer: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productWrapper: { width: "48%", marginBottom: 20 },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  likeButton: { position: "absolute", top: 10, right: 10, zIndex: 1, padding: 5 },
  productImage: { width: 120, height: 120, resizeMode: "contain", borderRadius: 10 },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: Colors.light.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  productName: { fontSize: 16, fontWeight: "600", textAlign: "center", marginVertical: 5 },
  productPrice: { fontSize: 14, color: Colors.light.gray },
  originalPrice: { textDecorationLine: "line-through", color: Colors.light.red, marginLeft: 5 },
});

export default FavoritesScreen;