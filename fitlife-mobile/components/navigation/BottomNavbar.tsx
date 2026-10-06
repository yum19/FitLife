import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const allNavItems = [
  {
    id: "home",
    label: "Home",
    icon: "home-outline",
    iconActive: "home",
    roles: ["client", "coach", "admin"], // Available to all roles
  },
  {
    id: "trainings",
    label: "Trainings",
    icon: "barbell-outline",
    iconActive: "barbell",
    roles: ["client", "coach", "admin"], // Available to all roles
  },
  {
    id: "product",
    label: "Store",
    icon: "bag-outline",
    iconActive: "bag",
    roles: ["client"], // Only available to clients
  },
  {
    id: "coachs",
    label: "Coachs",
    icon: "people-outline",
    iconActive: "people",
    roles: ["client", "coach", "admin"], // Available to all roles
  },
  {
    id: "settings",
    label: "Settings",
    icon: "settings-outline",
    iconActive: "settings",
    roles: ["client", "coach", "admin"], // Available to all roles
  },
  {
    id: "profile",
    label: "Profile",
    icon: "person-outline",
    iconActive: "person",
    roles: ["client", "coach", "admin"], // Available to all roles
  },
];

export function BottomNavbar({ onTabPress, activeTab }: { onTabPress?: (id: string) => void; activeTab?: string }) {
  const [activeItem, setActiveItem] = useState(activeTab || "home");
  const colorScheme = useColorScheme() || "light";
  const theme = Colors[colorScheme];
  
  // Get user from Redux store
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Filter navigation items based on user role
  const navItems = allNavItems.filter(item => {
    if (!user) {
      // If no user is logged in, show only basic items (you can customize this)
      return ["home", "trainings", "coachs"].includes(item.id);
    }
    
    // Check if user's role is in the allowed roles for this item
    return item.roles.includes(user.role || "client");
  });

  useEffect(() => {
    if (activeTab && activeTab !== activeItem) {
      setActiveItem(activeTab);
    }
  }, [activeTab]);

  const handlePress = (id: string) => {
    setActiveItem(id);
    if (onTabPress) onTabPress(id);
  };

  return (
    <View style={[styles.container]}>
      <View style={[styles.navbar, { backgroundColor: '#000', borderColor: theme.icon, shadowColor: theme.icon }]}>
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handlePress(item.id)}
              style={[styles.button, isActive && { backgroundColor: '#F97316' }]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isActive ? (item.iconActive as any) : (item.icon as any)}
                size={isActive ? 26 : 24}
                color={isActive ? theme.text : theme.icon}
                style={{ marginRight: isActive ? 8 : 0 }}
              />
              {isActive && <Text style={[styles.label, { color: theme.text }]}>{item.label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
    zIndex: 50,
  },
  navbar: {
    flexDirection: "row",
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    marginHorizontal: 8,
    backgroundColor: "transparent",
  },
  label: {
    fontWeight: "600",
    fontSize: 14,
  },
});