// frontend/app/(tabs)/ProductScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions, TextInput, ActivityIndicator, Alert } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import Animated, { Easing, useSharedValue, useAnimatedStyle, withRepeat, withTiming, FadeIn, FadeOut } from "react-native-reanimated";
import Icon from "react-native-vector-icons/Ionicons";
import { useProductService, Produit } from "@/services/ProductService";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";

const { width } = Dimensions.get("window");

const ProductScreen = () => {
  const colorScheme = useColorScheme();
  const { produits, loading, error } = useProductService();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cartCount, setCartCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0); // New state for favorite count
  const [favorites, setFavorites] = useState<Set<string>>(new Set()); // Store favorite product IDs
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  // Animation setup
  const translateX = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  const rotateValue = useSharedValue(0);
  const containerWidth = width * 2;
  const animationDuration = 8000;

  // Fetch cart count
  const fetchCart = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch("http://192.168.1.3:5000/api/cart", {
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
        throw new Error("Failed to fetch cart");
      }
      const data = await response.json();
      setCartCount(data.items ? data.items.length : 0);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  }, [token, dispatch, navigation]);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!token || !user) return;
    try {
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
        throw new Error("Failed to fetch favorites");
      }
      const data = await response.json();
      setFavorites(new Set(data.favorites.map(String))); // Convert favoriId to string for consistency
      setFavoriteCount(data.favorites.length);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  }, [token, user, dispatch, navigation]);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-containerWidth, {
        duration: animationDuration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      -1,
      false
    );

    scaleValue.value = withRepeat(
      withTiming(1.05, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    rotateValue.value = withRepeat(
      withTiming(360, {
        duration: 15000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [translateX, scaleValue, rotateValue, containerWidth]);

  // Fetch cart and favorites on component mount
  useEffect(() => {
    fetchCart();
    fetchFavorites();
  }, [fetchCart, fetchFavorites]);

  // Refresh cart and favorites every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("ProductScreen focused, refreshing cart and favorites...");
      fetchCart();
      fetchFavorites();
    }, [fetchCart, fetchFavorites])
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scaleValue.value }
      ],
    };
  }, []);

  const iconRotateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotateValue.value}deg` }],
    };
  }, []);

  // Navigate to cart
  const goToCart = () => {
    navigation.navigate("cart" as never, {
      from: "product"
    });
  };

  // Navigate to favorites
  const goToFavorites = () => {
    navigation.navigate("favorites" as never);
  };

  // Toggle favorite status
  const toggleFavorite = async (produitId: string) => {
    if (!token || !user) {
      Alert.alert("Login Required", "Please login to add products to favorites.", [
        { text: "OK", style: "default" },
        { text: "Login", onPress: () => navigation.navigate("auth/login" as never) }
      ]);
      return;
    }

    try {
      console.log('Toggling favorite for product:', produitId);
      
      const response = await fetch("http://192.168.1.3:5000/api/favorites/toggle", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          favoriId: produitId, // Send as string (MongoDB ObjectId)
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          dispatch(logout());
          navigation.navigate("auth/login" as never);
          return;
        }
        throw new Error("Failed to toggle favorite");
      }

      const data = await response.json();
      console.log('Toggle favorite response:', data);
      
      if (data.success) {
        setFavorites((prev) => {
          const newSet = new Set(prev);
          if (data.isFavorited) {
            newSet.add(produitId);
          } else {
            newSet.delete(produitId);
          }
          return newSet;
        });
        setFavoriteCount(data.isFavorited ? favoriteCount + 1 : favoriteCount - 1);
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

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorText}>Please check your network or backend server.</Text>
        <Text style={styles.errorText}>See console for details.</Text>
      </View>
    );
  }

  const filteredProduits = produits.filter((produit) => {
    const matchesCategory = selectedCategory === "all" || produit.categorie === selectedCategory;
    const matchesSearch = produit.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         produit.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         produit.marque.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "all": return "grid-outline";
      case "Food supplements": return "fitness";
      case "Sports equipment": return "barbell";
      default: return "ellipse";
    }
  };

  const getCategoryDisplayName = (cat: string) => {
    switch (cat) {
      case "all": return "All";
      case "Food supplements": return "Food supplements";
      case "Sports equipment": return "Sports equipment";
      default: return cat;
    }
  };

  const promoMessages = [
    { text: "🔥 Discover Exclusive Deals!", icon: "flame", gradient: ["#FF6B6B", "#FF8E53"] },
    { text: "⚡ 20% Off This Weekend!", icon: "flash", gradient: ["#4ECDC4", "#44A08D"] },
    { text: "💪 New Fitness Gear Arrived!", icon: "fitness", gradient: ["#A8E6CF", "#7FCDCD"] },
    { text: "🎯 Limited Time Offers!", icon: "target", gradient: ["#FFD93D", "#FF6B6B"] },
  ];

  return (
    <View style={styles.container}>
      {/* Search Header with Cart and Favorite Icons */}
      <View style={styles.searchHeader}>
        <Text style={styles.searchHeaderTitle}>Search</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.favoriteButton} onPress={goToFavorites}>
            <Icon name="heart" size={24} color="#fff" />
            {favoriteCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{favoriteCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartButton} onPress={goToCart}>
            <Icon name="cart" size={24} color="#fff" />
            {cartCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a product..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {["all", "Food supplements", "Sports equipment"].map((category) => (
          <TouchableOpacity 
            key={category}
            style={[
              styles.filterButton,
              selectedCategory === category && styles.filterButtonSelected
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Icon 
              name={getCategoryIcon(category)} 
              size={16} 
              color={selectedCategory === category ? "#F97316" : "#fff"} 
            />
            <Text 
              style={[
                styles.filterButtonText,
                selectedCategory === category && styles.filterButtonTextSelected
              ]}
            >
              {getCategoryDisplayName(category)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerText}></Text>
          <Text style={styles.subHeaderText}></Text>
        </View>

        <View style={styles.productsContainer}>
          {filteredProduits.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Icon name="search" size={80} color="#ccc" />
              <Text style={styles.noResultsTitle}>Not Found</Text>
              <Text style={styles.noResultsText}>Whoops! We can't find what you're looking for :(</Text>
            </View>
          ) : (
            filteredProduits.map((produit, index) => (
              <Animated.View
                key={produit._id}
                entering={FadeIn.delay(index * 100).duration(300)}
                exiting={FadeOut.duration(300)}
                style={styles.productWrapper}
              >
                <TouchableOpacity
                  style={styles.productCard}
                  onPress={() => navigation.navigate("ProductDetail", { product: produit, fromCart: false })}
                >
                  <TouchableOpacity
                    style={styles.likeButton}
                    onPress={() => toggleFavorite(produit._id)}
                  >
                    <Icon
                      name={favorites.has(produit._id) ? "heart" : "heart-outline"}
                      size={24}
                      color={favorites.has(produit._id) ? "#F97316" : Colors.light.gray}
                    />
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
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.promoContainer}>
        <View style={styles.promoGradientOverlay} />
        <View style={styles.particlesContainer}>
          {[...Array(6)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                iconRotateStyle,
                { left: `${15 + i * 15}%`, animationDelay: `${i * 0.5}s` }
              ]}
            >
              <Icon name="star" size={8} color="rgba(255,255,255,0.3)" />
            </Animated.View>
          ))}
        </View>
        <Animated.View style={[styles.promoInner, animatedStyle]}>
          {promoMessages.map((message, index) => (
            <View key={index} style={styles.promoItem}>
              <View style={styles.promoContent}>
                <Animated.View style={[styles.promoIconContainer, iconRotateStyle]}>
                  <Icon name={message.icon} size={24} color="#fff" />
                </Animated.View>
                <View style={styles.promoTextContainer}>
                  <Text style={styles.promoText}>{message.text}</Text>
                  <View style={styles.promoSubtitle}>
                    <Text style={styles.promoSubtitleText}>Don't miss out!</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
          {promoMessages.map((message, index) => (
            <View key={`duplicate-${index}`} style={styles.promoItem}>
              <View style={styles.promoContent}>
                <Animated.View style={[styles.promoIconContainer, iconRotateStyle]}>
                  <Icon name={message.icon} size={24} color="#fff" />
                </Animated.View>
                <View style={styles.promoTextContainer}>
                  <Text style={styles.promoText}>{message.text}</Text>
                  <View style={styles.promoSubtitle}>
                    <Text style={styles.promoSubtitleText}>Don't miss out!</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>
        <View style={styles.promoShineEffect} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: Colors.light.red, fontSize: 16 },
  searchHeader: {
    backgroundColor: "#F97316",
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchHeaderTitle: { fontSize: 20, fontWeight: "600", color: "#fff" },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 10 },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  countBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: { color: "#FFFFFF", fontSize: 10, fontWeight: "bold" },
  searchContainer: {
    backgroundColor: "#F97316",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchInputContainer: {
    backgroundColor: "#fff",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#333" },
  searchIcon: { marginLeft: 10 },
  filterContainer: {
    backgroundColor: "#F97316",
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  filterButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  filterButtonSelected: { backgroundColor: "#fff" },
  filterButtonText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  filterButtonTextSelected: { color: "#F97316" },
  scrollContainer: { flex: 1 },
  promoContainer: {
    height: 80,
    backgroundColor: "#F97316",
    overflow: "hidden",
    position: "relative",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  promoGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "linear-gradient(45deg, #FF6B6B, #F97316, #FFD93D)",
    opacity: 0.8,
  },
  particlesContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  particle: { position: "absolute", top: "20%" },
  promoInner: { flexDirection: "row", width: width * 4, zIndex: 2 },
  promoItem: { width: width, justifyContent: "center", paddingHorizontal: 20 },
  promoContent: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  promoIconContainer: { backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: 25, padding: 8, marginRight: 15 },
  promoTextContainer: { flex: 1 },
  promoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  promoSubtitle: { marginTop: 2 },
  promoSubtitleText: { fontSize: 12, color: "rgba(255, 255, 255, 0.8)", fontStyle: "italic" },
  promoShineEffect: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    zIndex: 3,
  },
  header: { padding: 1, alignItems: "center" },
  headerText: { fontSize: 28, fontWeight: "800", color: Colors.light.text },
  subHeaderText: { fontSize: 16, color: Colors.light.gray, fontStyle: "italic" },
  productsContainer: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    minHeight: 300,
    marginTop: -60,
  },
  noResultsContainer: { width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 50 },
  noResultsTitle: { fontSize: 24, fontWeight: "bold", color: "#333", marginTop: 20, marginBottom: 10 },
  noResultsText: { fontSize: 16, color: "#666", textAlign: "center" },
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

export default ProductScreen;