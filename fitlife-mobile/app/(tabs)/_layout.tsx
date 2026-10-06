// frontend/app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { selectIsAuthenticated, selectIsLoading } from "@/redux/slices/authSlice";
import { Redirect, usePathname, useRouter } from "expo-router";
import { useSelector } from "react-redux";

import Icon from "react-native-vector-icons/Ionicons";
import React from "react";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";

type TabId = "home" |"trainings"| "settings" | "profile" | "product"|"coachs"|"GymMapScreen";
type RoutePath = "/"|"/trainings"| "/settings" |  "/profile" | "/product" | "/coachs" | "/GymMapScreen";


type TabId = "home" | "trainings" | "settings" | "profile" | "coachs" | "product" | "cart" | "favorites";
type RoutePath = "/" | "/trainings" | "/settings" | "/profile" | "/coachs" | "/product" | "/cart" | "/favorites";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const router = useRouter();
  const pathname = usePathname();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  const routeToTab: Record<RoutePath, TabId> = {
    "/": "home",
    "/settings": "settings",
    "/trainings": "trainings",
    "/profile": "profile",
    "/coachs": "coachs",
    "/product": "product",

    "/cart": "cart",
    "/favorites": "favorites",

    "/GymMapScreen":"GymMapScreen"
    

  };

  const tabToRoute: Record<TabId, RoutePath> = {
    home: "/",
    settings: "/settings",
    trainings: "/trainings",
    profile: "/profile",
    coachs: "/coachs",
    product: "/product",

    cart: "/cart",
    favorites: "/favorites",
  };

  const getActiveTab = (): TabId => {
    if (pathname.includes('ProductDetail') || pathname.includes('product') || pathname.includes('cart') || pathname.includes('favorites')) {
      return "product";
    }
    if (routeToTab[pathname as RoutePath]) {
      return routeToTab[pathname as RoutePath];
    }
    return "home";

    GymMapScreen: "/GymMapScreen",
   

  };

  const activeTab: TabId = getActiveTab();

  let AuthGuard: React.ComponentType<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
  let BottomNavbar: React.ComponentType<{ activeTab: string; onTabPress: (id: string) => void }> = () => null;

  try {
    const AuthGuardModule = require("@/components/AuthGuard");
    AuthGuard = AuthGuardModule.AuthGuard || AuthGuardModule.default;
  } catch (error) {
    console.warn("AuthGuard not found, using fallback");
  }

  try {
    const BottomNavbarModule = require("@/components/navigation/BottomNavbar");
    BottomNavbar = BottomNavbarModule.BottomNavbar || BottomNavbarModule.default;
  } catch (error) {
    console.warn("BottomNavbar not found, using fallback");
  }

  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen
          name="trainings"
          options={{ headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? "barbell" : "barbell-outline"} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="add-programme" options={{ headerShown: false }} />
        <Tabs.Screen name="start-training" options={{ headerShown: false }} />
        <Tabs.Screen name="update-training" options={{ headerShown: false }} />
        <Tabs.Screen name="training-detail" options={{ headerShown: false }} />
        <Tabs.Screen name="update-session" options={{ headerShown: false }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
        <Tabs.Screen name="coachs" options={{ title: "Coachs" }} />

        <Tabs.Screen name="GymMapScreen" options={{ headerShown: false }}/>
        <Tabs.Screen name="GymListScreen" options={{ headerShown: false }}/>
        <Tabs.Screen name="GymDetailScreen" options={{ headerShown: false }}/>


        <Tabs.Screen
          name="product"
          options={{
            title: "Products",
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? "cart" : "cart-outline"} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: "Cart",
            tabBarIcon: ({ color, size }) => <Icon name="cart" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Favorites",
            tabBarIcon: ({ color, size }) => <Icon name="heart" size={size} color={color} />,
          }}
        />
      </Tabs>
      <BottomNavbar
        activeTab={activeTab}
        onTabPress={(id) => {
          const route = tabToRoute[id as TabId];
          if (route) router.replace(route);
        }}
      />
    </AuthGuard>
  );
}