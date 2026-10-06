// frontend/app/(tabs)/ProductDetail.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Alert } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { Produit } from "@/services/ProductService";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";

const { width } = Dimensions.get("window");

const ProductDetail = () => {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { product, fromCart } = route.params as { product: Produit; fromCart?: boolean };
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [selectedSize, setSelectedSize] = useState("37");
  const [selectedColor, setSelectedColor] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);

  const sizes = ["35", "36", "37", "38", "39", "40"];
  const colors = ["#F97316", "#1F2937", "#FFFFFF"];

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
        throw new Error(`Failed to fetch cart: ${response.status}`);
      }
      const data = await response.json();
      setCartCount(data.items ? data.items.length : 0);
      setCartItems(data.items || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  }, [token, dispatch, navigation]);

  const fetchFavoriteStatus = useCallback(async () => {
    if (!token || !user) return;
    try {
      console.log('Checking favorite status for user:', user._id, 'product:', product._id);
      const response = await fetch(`http://192.168.1.3:5000/api/favorites/check/${user._id}/${product._id}`, {
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
        throw new Error(`Failed to check favorite status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Favorite status response:', data);
      setIsFavorite(data.isFavorited);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  }, [token, user, product._id, dispatch, navigation]);

  const toggleFavorite = async () => {
    if (!token || !user) {
      Alert.alert("Login Required", "Please login to add products to favorites.", [
        { text: "OK", style: "default" },
        { text: "Login", onPress: () => navigation.navigate("auth/login" as never) }
      ]);
      return;
    }

    try {
      console.log('Toggling favorite for product:', product._id);
      const response = await fetch("http://192.168.1.3:5000/api/favorites/toggle", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          favoriId: product._id, // Send as string (MongoDB ObjectId)
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          dispatch(logout());
          navigation.navigate("auth/login" as never);
          return;
        }
        const errorText = await response.text();
        let errorMessage = "Failed to toggle favorite";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('Toggle favorite response:', data);
      setIsFavorite(data.isFavorited);
      Alert.alert("Success", data.isFavorited ? "Added to favorites" : "Removed from favorites");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", `Failed to toggle favorite: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchFavoriteStatus();
  }, [fetchCart, fetchFavoriteStatus]);

  useFocusEffect(
    useCallback(() => {
      console.log("ProductDetail screen focused, refreshing cart and favorite status...");
      fetchCart();
      fetchFavoriteStatus();
    }, [fetchCart, fetchFavoriteStatus])
  );

  const goBack = () => {
    if (fromCart) {
      navigation.navigate("cart" as never);
    } else {
      navigation.navigate("product" as never);
    }
  };

  const renderStars = (rating = 5) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Icon
        key={index}
        name="star"
        size={16}
        color={index < rating ? "#FFD700" : "#E5E5E5"}
        style={{ marginRight: 2 }}
      />
    ));
  };

  const checkIfProductInCart = () => {
    return cartItems.some(item => item.produitId._id === product._id);
  };

  const handleAddToCart = async () => {
    if (!token || !user) {
      Alert.alert("Login Required", "Please login to add products to your cart.");
      navigation.navigate("auth/login" as never);
      return;
    }

    if (checkIfProductInCart()) {
      Alert.alert(
        "Product Already in Cart",
        `${product.nom} is already in your cart. You can update the quantity from the cart page.`,
        [
          { text: "OK", style: "default" },
          { text: "Go to Cart", style: "default", onPress: () => navigation.navigate("cart" as never) }
        ]
      );
      return;
    }

    try {
      const response = await fetch("http://192.168.1.3:5000/api/cart/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          produitId: product._id,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          dispatch(logout());
          Alert.alert("Session Expired", "Please login again.");
          navigation.navigate("auth/login" as never);
          return;
        }
        let errorMessage = "Failed to add product to cart";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }

      await fetchCart();
      Alert.alert("Success", "Product added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", `Failed to add product to cart: ${error.message}`);
    }
  };

  const goToCart = () => {
    navigation.navigate("cart" as never);
  };

  const isInCart = checkIfProductInCart();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addToCartButton, isInCart && styles.inCartButton]}
          onPress={handleAddToCart}
        >
          <Text style={[styles.addToCartText, isInCart && styles.inCartText]}>
            {isInCart ? "Already in Cart" : "Add to cart"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartButton} onPress={goToCart}>
          <Icon name="cart" size={24} color="#333" />
          {cartCount > 0 && (
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
              onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
            />
          </View>
          <View style={styles.colorIndicators}>
            {colors.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  selectedColor === index && styles.selectedColorDot,
                  color === "#FFFFFF" && styles.whiteDot,
                ]}
                onPress={() => setSelectedColor(index)}
              />
            ))}
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <Icon
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? "#F97316" : "#666"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.productName}>{product.nom}</Text>
          <View style={styles.ratingContainer}>{renderStars(5)}</View>
          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>$</Text>
              <Text style={styles.productPrice}>{product.prix.toLocaleString()}</Text>
              <Text style={styles.originalPrice}>${(product.prix + 50).toLocaleString()}</Text>
            </View>
            <Text style={styles.stockText}>Available in stock</Text>
          </View>
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.productDescription}>
              {product.description || "This premium product offers exceptional quality and performance."}
            </Text>
          </View>
          <View style={styles.sizeSection}>
            <View style={styles.sizeContainer}>
              {sizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeButton,
                    selectedSize === size && styles.selectedSizeButton,
                  ]}
                  onPress={() => setSelectedSize(size)}
                >
                  <Text
                    style={[
                      styles.sizeText,
                      selectedSize === size && styles.selectedSizeText,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.productInfo}>Category: {product.categorie}</Text>
            <Text style={styles.productInfo}>Brand: {product.marque}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "#F8F9FA",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    elevation: 3,
  },
  scrollContainer: { flex: 1 },
  imageSection: {
    alignItems: "center",
    paddingVertical: 20,
    position: "relative",
  },
  imageContainer: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: "#FFFFFF",
    borderRadius: width * 0.35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
  },
  productImage: { width: width * 0.5, height: width * 0.5, resizeMode: "contain" },
  colorIndicators: { flexDirection: "row", justifyContent: "center", marginBottom: 10 },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginHorizontal: 4 },
  selectedColorDot: { borderWidth: 2, borderColor: "#333" },
  whiteDot: { borderWidth: 1, borderColor: "#E5E7EB" },
  favoriteButton: {
    position: "absolute",
    right: 30,
    top: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 100,
    marginTop: 10,
  },
  productName: { fontSize: 24, fontWeight: "700", color: "#1F2937", marginBottom: 8 },
  ratingContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  priceContainer: { flexDirection: "row", alignItems: "baseline" },
  currency: { fontSize: 18, fontWeight: "600", color: "#1F2937", marginRight: 2 },
  productPrice: { fontSize: 24, fontWeight: "700", color: "#1F2937", marginRight: 8 },
  originalPrice: { fontSize: 16, color: "#9CA3AF", textDecorationLine: "line-through" },
  stockText: { fontSize: 14, color: "#10B981", fontWeight: "500" },
  aboutSection: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1F2937", marginBottom: 10 },
  productDescription: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
  sizeSection: { marginBottom: 25 },
  sizeContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sizeButton: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedSizeButton: { backgroundColor: "#F97316", borderColor: "#F97316" },
  sizeText: { fontSize: 14, fontWeight: "500", color: "#6B7280" },
  selectedSizeText: { color: "#FFFFFF", fontWeight: "600" },
  infoSection: { marginTop: 10 },
  productInfo: { fontSize: 14, color: "#6B7280", marginBottom: 5 },
  addToCartButton: {
    backgroundColor: "#F97316",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  inCartButton: { backgroundColor: "#10B981", shadowColor: "#10B981" },
  addToCartText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  inCartText: { color: "#FFFFFF" },
  cartButton: {
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
    elevation: 3,
    position: "relative",
  },
  cartCountBadge: {
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
  cartCountText: { color: "#FFFFFF", fontSize: 10, fontWeight: "bold" },
});

export default ProductDetail;