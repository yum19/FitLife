import { ThemedText } from "@/components/ThemedText";
import { logout } from "@/redux/slices/authSlice";
import { RootState, store } from "@/redux/store";
import { calculateBMI, getBMICategory } from "@/utils/fitness";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator, TextInput, Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { progressionService, type Progression } from "@/services/progressionService";
import { API_URL } from "@/constants/Config";

const ICONS = {
  settings: "settings-outline",
  mail: "mail-outline",
  calendar: "calendar-outline",
  user: "person-outline",
  arrowUp: "arrow-up-outline",
  weight: "barbell-outline",
  logout: "log-out-outline",
};

function ProfileItem({ icon, label, value }: { icon: keyof typeof ICONS; label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={ICONS[icon] as any} size={18} color="#F97316" style={{ marginRight: 12 }} />
      <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      <View style={{ flex: 1 }} />
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
    </View>
  );
}

function MetricCard({ label, value, unit, color, change }: { 
  label: string; 
  value: number | string; 
  unit?: string; 
  color?: string;
  change?: number;
}) {
  return (
    <View style={[styles.metricCard, color ? { backgroundColor: color } : {}]}>
      <ThemedText style={styles.metricLabel}>{label}</ThemedText>
      <View style={styles.metricValueContainer}>
        <ThemedText style={styles.metricValue}>{value}</ThemedText>
        {unit && <ThemedText style={styles.metricUnit}>{unit}</ThemedText>}
      </View>
      {change !== undefined && (
        <View style={styles.changeContainer}>
          <Ionicons 
            name={change >= 0 ? "arrow-up" : "arrow-down"} 
            size={16} 
            color={change >= 0 ? "#22bb33" : "#ff3b30"} 
          />
          <ThemedText style={[styles.changeText, { 
            color: change >= 0 ? "#22bb33" : "#ff3b30" 
          }]}>
            {Math.abs(change).toFixed(1)} {unit}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [progressions, setProgressions] = useState<Progression[]>([]);
  const [loadingProgressions, setLoadingProgressions] = useState(true);
  const [showAddProgressionModal, setShowAddProgressionModal] = useState(false);
  const [selectedType, setSelectedType] = useState<null | 'poids' | 'calories_brulees' | 'stress' | 'sommeil'>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [newProgression, setNewProgression] = useState({
    type: 'poids' as 'poids' | 'calories_brulees' | 'stress' | 'sommeil',
    valeur: '',
    notes: '',
  });
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  const fetchProgressions = async () => {
    try {
      setError(null);
      setLoadingProgressions(true);
      if (user?._id) {
        console.log('Fetching progressions for user:', user._id);
        console.log('API URL:', API_URL);
        const data = await progressionService.getProgressionsByClientId(user._id);
        console.log('Progression data:', data);
        setProgressions(data);
      }
    } catch (error: any) {
      console.error('Error fetching progressions:', {
        message: error.message,
        userId: user?._id,
        stack: error.stack
      });
      setError(error.message || 'Impossible de charger vos progressions. Veuillez réessayer plus tard.');
    } finally {
      setLoadingProgressions(false);
    }
  };

  useEffect(() => {
    fetchProgressions();
  }, [user?._id]);

  const handleLogout = () => setShowLogoutDialog(true);
  const confirmLogout = () => {
    setShowLogoutDialog(false);
    dispatch(logout());
  };

  const initials = user ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase() : '';
  
  const getLatestProgression = (type: 'poids' | 'calories_brulees' | 'stress' | 'sommeil') => {
    const typeProgressions = progressions
      .filter(p => p.type === type)
      .sort((a, b) => new Date(b.dateEnregistrement).getTime() - new Date(a.dateEnregistrement).getTime());
    
    if (typeProgressions.length >= 2) {
      return {
        current: typeProgressions[0].valeur,
        change: typeProgressions[0].valeur - typeProgressions[1].valeur
      };
    } else if (typeProgressions.length === 1) {
      return {
        current: typeProgressions[0].valeur,
        change: 0
      };
    }
    return null;
  };

  // Calculate fitness metrics
  const [fitnessMetrics, setFitnessMetrics] = useState<{
    bmi: string;
    bmr: number;
    tdee: number;
    bmiCategory: { category: string; color: string };
  } | null>(null);

  const fetchFitnessMetrics = async () => {
    try {
      if (!user?.poids || !user?.taille || !user?.age || !user?.sexe) {
        return;
      }

      const bmi = calculateBMI(user.poids, user.taille / 100);
      const bmiCategory = getBMICategory(bmi);

      // Fetch BMR from backend
      const bmrResponse = await fetch(`${API_URL}/auth/calculate-bmr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.getState().auth.token}`,
        },
        body: JSON.stringify({
          age: user.age,
          sexe: user.sexe.toLowerCase(),
          taille: user.taille,
          poids: user.poids,
        }),
      });
      const { bmr } = await bmrResponse.json();

      // Fetch TDEE from backend
      const tdeeResponse = await fetch(`${API_URL}/auth/calculate-tdee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.getState().auth.token}`,
        },
        body: JSON.stringify({
          bmr,
          niveauActivite: user.niveauActivite || 'modérément actif',
        }),
      });
      const { tdee } = await tdeeResponse.json();

      setFitnessMetrics({
        bmi: bmi.toFixed(1),
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        bmiCategory,
      });
    } catch (error) {
      console.error('Error fetching fitness metrics:', error);
    }
  };

  useEffect(() => {
    fetchFitnessMetrics();
  }, [user?.poids, user?.taille, user?.age, user?.sexe, user?.niveauActivite]);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={["#FFF6F0", "#FFE0C7"]} style={styles.background}>
        <ScrollView 
          style={{ width: '100%' }}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.settingsIcon} onPress={() => router.push("/settings-edit") }>
              <Ionicons 
                name={ICONS.settings as any} 
                size={isSmallDevice ? 22 : (isPad ? 30 : 26)} 
                color="#F97316" 
              />
            </TouchableOpacity>
          </View>
          {/* Main Card */}
          <View style={styles.card}>
          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            <LinearGradient colors={["#F97316", "#FFB86B"]} style={styles.avatarBorder}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>{initials}</ThemedText>
              </View>
            </LinearGradient>
            <ThemedText style={styles.name}>{user?.prenom} {user?.nom}</ThemedText>
            <ThemedText style={styles.role}>{user?.role?.toUpperCase()}</ThemedText>
          </View>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <ProfileItem icon="mail" label="Email" value={user?.email} />
            <ProfileItem icon="calendar" label="Age" value={user?.age} />
            <ProfileItem icon="user" label="Gender" value={user?.sexe} />
            <ProfileItem icon="arrowUp" label="Height" value={user?.taille ? `${user.taille} cm` : undefined} />
            <ProfileItem icon="weight" label="Weight" value={user?.poids ? `${user.poids} kg` : undefined} />
          </View>

          {/* Fitness Metrics */}
          {fitnessMetrics && (
            <View style={styles.metricsContainer}>
              <MetricCard
                label="BMI"
                value={fitnessMetrics.bmi}
                unit={fitnessMetrics.bmiCategory.category}
                color={fitnessMetrics.bmiCategory.category === 'Normal weight' ? '#E8F5E9' : '#FFF3E0'}
              />
              <MetricCard
                label="BMR"
                value={fitnessMetrics.bmr}
                unit="kcal/day"
              />
              <MetricCard
                label="TDEE"
                value={fitnessMetrics.tdee}
                unit="kcal/day"
                color="#F0F4FF"
              />
            </View>
          )}

          {/* Progress Metrics */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.progressTitle}>Your Progress</ThemedText>
                <ThemedText style={styles.progressPeriod}>Last 30 days</ThemedText>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setShowAddProgressionModal(true)}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {loadingProgressions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F97316" />
                <ThemedText style={styles.loadingText}>Loading your data...</ThemedText>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={24} color="#FF3B30" />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => {
                    setLoadingProgressions(true);
                    fetchProgressions();
                  }}
                >
                  <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                </TouchableOpacity>
              </View>
            ) : progressions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="fitness-outline" size={40} color="#F97316" />
                                  <ThemedText style={styles.emptyText}>
                    No progress recorded yet.
                  </ThemedText>
                  <ThemedText style={styles.emptySubText}>
                    Start tracking your progress to see your results here.
                  </ThemedText>
              </View>
            ) : (
              <View style={styles.metricsContainer}>
                {getLatestProgression('poids') && (
                  <TouchableOpacity onPress={() => {
                    setSelectedType('poids');
                    setShowHistoryModal(true);
                  }}>
                    <MetricCard
                      label="Weight"
                      value={getLatestProgression('poids')!.current}
                      unit="kg"
                      change={getLatestProgression('poids')!.change}
                      color="#FFF5F5"
                    />
                  </TouchableOpacity>
                )}
                {getLatestProgression('calories_brulees') && (
                  <TouchableOpacity onPress={() => {
                    setSelectedType('calories_brulees');
                    setShowHistoryModal(true);
                  }}>
                    <MetricCard
                      label="Calories Burned"
                      value={getLatestProgression('calories_brulees')!.current}
                      unit="kcal"
                      change={getLatestProgression('calories_brulees')!.change}
                      color="#F0FDF4"
                    />
                  </TouchableOpacity>
                )}
                {getLatestProgression('stress') && (
                  <TouchableOpacity onPress={() => {
                    setSelectedType('stress');
                    setShowHistoryModal(true);
                  }}>
                    <MetricCard
                      label="Stress Level"
                      value={getLatestProgression('stress')!.current}
                      unit="level"
                      change={getLatestProgression('stress')!.change}
                      color="#EFF6FF"
                    />
                  </TouchableOpacity>
                )}
                {getLatestProgression('sommeil') && (
                  <TouchableOpacity onPress={() => {
                    setSelectedType('sommeil');
                    setShowHistoryModal(true);
                  }}>
                    <MetricCard
                      label="Sleep"
                      value={getLatestProgression('sommeil')!.current}
                      unit="hours"
                      change={getLatestProgression('sommeil')!.change}
                      color="#FDF4FF"
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          
          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name={ICONS.logout as any} size={20} color="#fff" style={{ marginRight: 8 }} />
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
          </TouchableOpacity>
        </View>
        {/* History Modal */}
        <Modal
          visible={showHistoryModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowHistoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '80%' }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  {selectedType === 'poids' ? 'Weight History' :
                   selectedType === 'calories_brulees' ? 'Calories History' :
                   selectedType === 'stress' ? 'Stress History' :
                   'Sleep History'}
                </ThemedText>
                <TouchableOpacity 
                  onPress={() => setShowHistoryModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.historyList}>
                {progressions
                  .filter(p => p.type === selectedType)
                  .sort((a, b) => new Date(b.dateEnregistrement).getTime() - new Date(a.dateEnregistrement).getTime())
                  .map((progression, index, array) => {
                    const date = new Date(progression.dateEnregistrement);
                    const change = index < array.length - 1 
                      ? progression.valeur - array[index + 1].valeur
                      : 0;
                    
                    return (
                      <View key={progression._id} style={styles.historyItem}>
                        <View style={styles.historyItemMain}>
                          <ThemedText style={styles.historyValue}>
                            {progression.valeur} {progression.unite}
                          </ThemedText>
                          <ThemedText style={styles.historyDate}>
                            {date.toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </ThemedText>
                        </View>
                        {change !== 0 && (
                          <View style={[styles.changeContainer, { marginTop: 0 }]}>
                            <Ionicons 
                              name={change > 0 ? "arrow-up" : "arrow-down"} 
                              size={16} 
                              color={change > 0 ? "#22bb33" : "#ff3b30"} 
                            />
                            <ThemedText style={[styles.changeText, { 
                              color: change > 0 ? "#22bb33" : "#ff3b30" 
                            }]}>
                              {Math.abs(change).toFixed(1)} {progression.unite}
                            </ThemedText>
                          </View>
                        )}
                        {progression.notes && (
                          <ThemedText style={styles.historyNotes}>
                            {progression.notes}
                          </ThemedText>
                        )}
                      </View>
                    );
                  })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Add Progression Modal */}
        <Modal
          visible={showAddProgressionModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddProgressionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ThemedText style={styles.modalTitle}>Add Progress</ThemedText>
              
              {/* Type Selector */}
              <View style={styles.progressionTypeSelector}>
                {(['poids', 'calories_brulees', 'stress', 'sommeil'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      {
                        borderColor: newProgression.type === type ? '#F97316' : '#ddd',
                        backgroundColor: newProgression.type === type ? '#FFF6F0' : 'transparent',
                      }
                    ]}
                    onPress={() => setNewProgression(prev => ({ ...prev, type }))}
                  >
                    <ThemedText style={[
                      styles.typeOptionText,
                      { color: newProgression.type === type ? '#F97316' : '#666' }
                    ]}>
                      {(() => {
                        switch(type) {
                          case 'poids': return 'Poids';
                          case 'calories_brulees': return 'Calories';
                          case 'stress': return 'Stress';
                          case 'sommeil': return 'Sommeil';
                          default: return type;
                        }
                      })()}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Value Input */}
              <TextInput
                style={styles.progressionModalInput}
                placeholder="Value"
                value={newProgression.valeur}
                onChangeText={(text) => setNewProgression(prev => ({ ...prev, valeur: text }))}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />

              {/* Notes Input */}
              <TextInput
                style={[styles.progressionModalInput, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Notes (optional)"
                value={newProgression.notes}
                onChangeText={(text) => setNewProgression(prev => ({ ...prev, notes: text }))}
                multiline
                numberOfLines={4}
                placeholderTextColor="#999"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddProgressionModal(false);
                    setNewProgression({ type: 'poids', valeur: '', notes: '' });
                  }}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: '#F97316' }]}
                  onPress={async () => {
                    try {
                      if (!newProgression.valeur) {
                        Alert.alert('Error', 'Please enter a value');
                        return;
                      }

                      const value = parseFloat(newProgression.valeur);
                      if (isNaN(value)) {
                        Alert.alert('Error', 'Please enter a valid number');
                        return;
                      }

                      // Validate values based on type
                      if (newProgression.type === 'stress' && (value < 0 || value > 10)) {
                        Alert.alert('Error', 'Stress level must be between 0 and 10');
                        return;
                      }
                      if (newProgression.type === 'sommeil' && (value < 0 || value > 24)) {
                        Alert.alert('Error', 'Sleep hours must be between 0 and 24');
                        return;
                      }
                      if ((newProgression.type === 'poids' || newProgression.type === 'calories_brulees') && value < 0) {
                        Alert.alert('Error', 'Value cannot be negative');
                        return;
                      }

                      await progressionService.addProgression({
                        clientId: { _id: user!._id, email: user!.email, nom: user!.nom },
                        type: newProgression.type,
                        valeur: value,
                        unite: newProgression.type === 'poids' ? 'kg'
                             : newProgression.type === 'calories_brulees' ? 'kcal'
                             : newProgression.type === 'stress' ? 'niveau'
                             : 'heures',
                        dateEnregistrement: new Date().toISOString(),
                        notes: newProgression.notes || undefined,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        __v: 0
                      });

                      // Refresh progressions
                      fetchProgressions();
                      
                      // Reset and close modal
                      setNewProgression({ type: 'poids', valeur: '', notes: '' });
                      setShowAddProgressionModal(false);
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'An error occurred');
                    }
                  }}
                >
                  <ThemedText style={styles.confirmButtonText}>Add</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Logout Confirmation Dialog */}
        <Modal
          visible={showLogoutDialog}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutDialog(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ThemedText style={styles.modalTitle}>Logout</ThemedText>
              <ThemedText style={styles.modalMessage}>Are you sure you want to logout?</ThemedText>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowLogoutDialog(false)}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmLogout}
                >
                  <ThemedText style={styles.confirmButtonText}>Logout</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const isPad = SCREEN_WIDTH > 768;
const isTallDevice = SCREEN_HEIGHT > 800;
const horizontalPadding = isSmallDevice ? 12 : (isPad ? 24 : 16);
const verticalPadding = isSmallDevice ? 16 : (isPad ? 32 : 24);

const styles = StyleSheet.create({
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  historyList: {
    width: '100%',
    marginBottom: 16,
  },
  historyItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyItemMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
  },
  historyNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFF6F0',
  },
  addButton: {
    backgroundColor: '#F97316',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  progressionModalInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    fontSize: 16,
    color: '#222',
  },
  progressionTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    flexGrow: 1,
    width: '100%',
    maxWidth: isPad ? 1000 : 600,
    alignSelf: 'center',
    paddingHorizontal: horizontalPadding,
    paddingVertical: verticalPadding,
  },
  metricsContainer: {
    flexDirection: 'column',
    gap: isSmallDevice ? 8 : (isPad ? 16 : 12),
    width: '100%',
    marginVertical: isSmallDevice ? 12 : (isPad ? 24 : 16),
  },
  metricCard: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: isSmallDevice ? 12 : (isPad ? 20 : 16),
    padding: isSmallDevice ? 12 : (isPad ? 24 : 16),
    shadowColor: '#F97316',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: SCREEN_WIDTH <= 340 ? 8 : 0,
  },
  metricLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValue: {
    fontSize: 24,
    color: '#222',
    fontWeight: 'bold',
  },
  metricUnit: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '600',
    color: '#222',
  },
  progressPeriod: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#666',
  },
  progressSection: {
    width: '100%',
    marginTop: 16,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF9F6',
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: horizontalPadding,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: isTallDevice ? 48 : (SCREEN_HEIGHT < 700 ? 32 : 40),
    marginBottom: isSmallDevice ? 4 : (isPad ? 16 : 8),
    paddingHorizontal: horizontalPadding,
  },
  settingsIcon: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#F97316',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  card: {
    width: '100%',
    maxWidth: isPad ? 1000 : 600,
    backgroundColor: '#fff',
    borderRadius: isSmallDevice ? 20 : (isPad ? 32 : 28),
    padding: isSmallDevice ? 20 : (isPad ? 36 : 28),
    shadowColor: '#F97316',
    shadowOpacity: 0.13,
    shadowRadius: isPad ? 24 : 18,
    shadowOffset: { width: 0, height: isPad ? 12 : 8 },
    elevation: 10,
    alignItems: 'center',
    paddingBottom: isTallDevice ? 80 : (SCREEN_HEIGHT < 700 ? 60 : 70), // Adjust space for BottomNavbar
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: isSmallDevice ? 4 : 8,
    marginBottom: isSmallDevice ? 12 : 16,
  },
  avatarBorder: {
    width: isSmallDevice ? 88 : (isPad ? 120 : 104),
    height: isSmallDevice ? 88 : (isPad ? 120 : 104),
    borderRadius: isSmallDevice ? 44 : (isPad ? 60 : 52),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallDevice ? 8 : 12,
    shadowColor: '#F97316',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatar: {
    width: isSmallDevice ? 76 : (isPad ? 104 : 90),
    height: isSmallDevice ? 76 : (isPad ? 104 : 90),
    borderRadius: isSmallDevice ? 38 : (isPad ? 52 : 45),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  avatarText: {
    color: '#F97316',
    fontSize: 36,
    fontWeight: 'bold',
  },
  name: {
    fontSize: isSmallDevice ? 22 : (isPad ? 30 : 26),
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
    textAlign: 'center',
  },
  role: {
    fontSize: isSmallDevice ? 13 : (isPad ? 17 : 15),
    color: '#F97316',
    fontWeight: '600',
    marginBottom: isSmallDevice ? 6 : 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: isSmallDevice ? 14 : 18,
    padding: isSmallDevice ? 16 : (isPad ? 28 : 22),
    marginBottom: isSmallDevice ? 20 : 28,
    width: '100%',
    shadowColor: '#F97316',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isSmallDevice ? 12 : 16,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
    marginRight: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
    justifyContent: 'center',
    marginBottom: 16, // Add margin to ensure visibility
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: isSmallDevice ? 16 : (isPad ? 24 : 20),
    padding: isSmallDevice ? 20 : (isPad ? 36 : 28),
    width: '100%',
    maxWidth: isPad ? 500 : (isSmallDevice ? 300 : 350),
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOpacity: 0.13,
    shadowRadius: isPad ? 24 : 18,
    shadowOffset: { width: 0, height: isPad ? 12 : 8 },
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F97316',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#222',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 6,
  },
  cancelButtonText: {
    color: '#222',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 6,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});