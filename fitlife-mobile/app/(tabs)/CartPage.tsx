import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";

const { width } = Dimensions.get("window");

interface CartItem {
  _id: string;
  produitId: {
    _id: string;
    nom: string;
    prix: number;
    image: string;
    categorie: string;
    marque: string;
    description?: string;
  };
  quantity: number;
}

interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  prixTotal: number;
}

const CartPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  // Get the previous page from params, default to "product" if not provided
  const previousPage = params.from as string || "product";
  const previousProduct = params.product ? JSON.parse(params.product as string) : null;

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!token) {
      Alert.alert("Login Required", "Please login to view your cart.");
      router.push("/auth/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://192.168.1.3:5000/api/cart", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          dispatch(logout());
          router.push("/auth/login");
          return;
        }
        throw new Error("Failed to fetch cart");
      }

      const data = await response.json();
      console.log("Cart data fetched:", data);
      setCart(data);
    } catch (error) {
      console.error("Error fetching cart:", error);
      Alert.alert("Error", "Failed to load cart. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, dispatch, router]);

  // Fetch cart when component mounts
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Refresh cart every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Cart screen focused, refreshing cart...");
      fetchCart();
    }, [fetchCart])
  );

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch("http://192.168.1.3:5000/api/cart/update", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          produitId: productId,
          quantity: newQuantity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update quantity");
      }

      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (error) {
      console.error("Error updating quantity:", error);
      Alert.alert("Error", "Failed to update quantity. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      setUpdating(true);
      const response = await fetch("http://192.168.1.3:5000/api/cart/remove", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          produitId: productId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      const updatedCart = await response.json();
      setCart(updatedCart);
      Alert.alert("Success", "Item removed from cart!");
    } catch (error) {
      console.error("Error removing from cart:", error);
      Alert.alert("Error", "Failed to remove item. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const proceedToCheckout = () => {
    if (!cart || cart.items.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart before checkout.");
      return;
    }
    // Navigate to checkout page (you can create this later)
    Alert.alert("Checkout", "Checkout functionality coming soon!");
  };

  // Smart back navigation function
  const handleGoBack = () => {
    console.log("Going back from cart. previousPage:", previousPage, "previousProduct:", previousProduct);
    
    if (previousPage === "ProductDetail" && previousProduct) {
      // Go back to ProductDetail with the product data
      router.replace({
        pathname: "/ProductDetail",
        params: { 
          product: JSON.stringify(previousProduct),
          fromCart: "false" // Reset the fromCart flag
        }
      });
    } else if (previousPage === "product") {
      // Go back to product list
      router.replace("/product");
    } else {
      // Fallback to generic back
      router.back();
    }
  };

  // Function to navigate to product detail from cart item
  const navigateToProductDetail = (product: CartItem['produitId']) => {
    router.push({
      pathname: "/ProductDetail",
      params: { 
        product: JSON.stringify(product),
        fromCart: "true"
      }
    });
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <TouchableOpacity 
      style={styles.cartItem}
      onPress={() => navigateToProductDetail(item.produitId)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.produitId.image }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.produitId.nom}</Text>
        <Text style={styles.itemCategory}>{item.produitId.categorie}</Text>
        <Text style={styles.itemBrand}>{item.produitId.marque}</Text>
        <Text style={styles.itemPrice}>${item.produitId.prix}</Text>
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent triggering the parent TouchableOpacity
            updateQuantity(item.produitId._id, item.quantity - 1);
          }}
          disabled={updating}
        >
          <Icon name="remove" size={16} color="#F97316" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent triggering the parent TouchableOpacity
            updateQuantity(item.produitId._id, item.quantity + 1);
          }}
          disabled={updating}
        >
          <Icon name="add" size={16} color="#F97316" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={(e) => {
          e.stopPropagation(); // Prevent triggering the parent TouchableOpacity
          removeFromCart(item.produitId._id);
        }}
        disabled={updating}
      >
        <Icon name="trash-outline" size={20} color="#FF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Icon name="cart-outline" size={80} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>Add some products to get started</Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={handleGoBack}
      >
        <Text style={styles.shopButtonText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.headerRight}>
          {cart && cart.items.length > 0 && (
            <Text style={styles.itemCount}>{cart.items.length} items</Text>
          )}
        </View>
      </View>

      {/* Cart Content */}
      {!cart || cart.items.length === 0 ? (
        renderEmptyCart()
      ) : (
        <View style={styles.content}>
          <FlatList
            data={cart.items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />

          {/* Cart Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>${cart.prixTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping:</Text>
              <Text style={styles.summaryValue}>Free</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${cart.prixTotal.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.checkoutButton, updating && styles.disabledButton]}
              onPress={proceedToCheckout}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                  <Icon name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
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
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  cartItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F97316",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEF3E2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F97316",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: "#F97316",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  shopButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  summaryContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F97316",
  },
  checkoutButton: {
    backgroundColor: "#F97316",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
  },
});

export default CartPage;