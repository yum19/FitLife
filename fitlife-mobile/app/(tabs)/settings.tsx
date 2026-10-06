import { ThemedText } from "@/components/ThemedText";
import { logout } from "@/redux/slices/authSlice";
import { RootState } from "@/redux/store";
import { useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

function ProfileScreen({ onClose }: { onClose: () => void }) {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          dispatch(logout());
        },
      },
    ]);
  };

  const initials = user ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase() : '';

  return (
    <View style={profileStyles.modalOverlay}>
      <View style={profileStyles.card}>
        <TouchableOpacity style={profileStyles.closeButton} onPress={onClose}>
          <ThemedText style={profileStyles.closeButtonText}>×</ThemedText>
        </TouchableOpacity>
        <View style={profileStyles.avatarContainer}>
          <View style={profileStyles.avatar}>
            <ThemedText style={profileStyles.avatarText}>{initials}</ThemedText>
          </View>
          <ThemedText style={profileStyles.name}>{user?.prenom} {user?.nom}</ThemedText>
          <ThemedText style={profileStyles.role}>{user?.role?.toUpperCase()}</ThemedText>
        </View>
        <View style={profileStyles.infoCard}>
          <ProfileItem label="Email" value={user?.email} />
          <ProfileItem label="Age" value={user?.age} />
          <ProfileItem label="Gender" value={user?.sexe} />
          <ProfileItem label="Height" value={user?.taille ? `${user.taille} cm` : undefined} />
          <ProfileItem label="Weight" value={user?.poids ? `${user.poids} kg` : undefined} />
        </View>
        <TouchableOpacity style={profileStyles.logoutButton} onPress={handleLogout}>
          <ThemedText style={profileStyles.logoutButtonText}>Logout</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ProfileItem({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <View style={profileStyles.infoRow}>
      <ThemedText style={profileStyles.infoLabel}>{label}</ThemedText>
      <ThemedText style={profileStyles.infoValue}>{value}</ThemedText>
    </View>
  );
}

const profileStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
    backgroundColor: '#F97316',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#F97316',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
  },
  role: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function SettingsScreen() {
  const [profileVisible, setProfileVisible] = useState(false);

  return (
    <View style={settingsStyles.background}>
      <ScrollView contentContainerStyle={settingsStyles.scrollContainer}>
        <View style={settingsStyles.card}>
          <ThemedText style={settingsStyles.title}>Settings</ThemedText>
          <TouchableOpacity style={settingsStyles.button} onPress={() => setProfileVisible(true)}>
            <ThemedText style={settingsStyles.buttonText}>View Profile</ThemedText>
          </TouchableOpacity>
          {/* Add more settings sections here in the future */}
        </View>
      </ScrollView>
      <Modal
        visible={profileVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileVisible(false)}
      >
        <ProfileScreen onClose={() => setProfileVisible(false)} />
      </Modal>
    </View>
  );
}

const settingsStyles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFF6F0',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 