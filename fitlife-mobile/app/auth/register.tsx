import { ThemedText } from "@/components/ThemedText"
import TagInput from "@/components/ui/TagInput"
import { registerUser } from "@/redux/slices/authSlice"
import { AppDispatch } from "@/redux/store"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from '@react-native-community/datetimepicker'
import { Picker } from '@react-native-picker/picker'
import { router } from "expo-router"
import { useState } from "react"
import {
    Alert,
    FlatList,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View
} from "react-native"
import { useDispatch, useSelector } from "react-redux"

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("client");

  // Shared fields
  const [prenom, setPrenom] = useState("")
  const [nom, setNom] = useState("")
  const [email, setEmail] = useState("")
  const [motDePasse, setMotDePasse] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [age, setAge] = useState("")
  const [sexe, setSexe] = useState("")
  const [taille, setTaille] = useState("")
  const [poids, setPoids] = useState('70'); // default to 70kg
  const weightOptions = Array.from({ length: 201 - 30 }, (_, i) => (i + 30).toString());
  const stepLabels = ['Account', 'Name', 'Birth', 'Height', 'Weight', 'Details'];

  // Client fields
  const [objectif, setObjectif] = useState("")
  const [allergies, setAllergies] = useState<string[]>([])

  // Coach/Nutritionist fields
  const [certifications, setCertifications] = useState<string[]>([])
  const [specialites, setSpecialites] = useState<string[]>([])
  const [disponible, setDisponible] = useState(false)

  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Add state for niveauActivite
  const [niveauActivite, setNiveauActivite] = useState("");

  const dispatch = useDispatch<AppDispatch>()
  const { error, loading } = useSelector((state: any) => state.auth)

  // Enum mappings for user-friendly labels
  const allergiesEnum = [
    { value: "peanuts", label: "Arachides" },
    { value: "tree_nuts", label: "Fruits à coque" },
    { value: "milk", label: "Lait" },
    { value: "eggs", label: "Oeufs" },
    { value: "fish", label: "Poisson" },
    { value: "crustaceans", label: "Crustacés" },
    { value: "mollusks", label: "Mollusques" },
    { value: "wheat", label: "Blé" },
    { value: "soy", label: "Soja" },
    { value: "sesame", label: "Sésame" },
  ];
  const objectifsEnum = [
    { value: "weight loss", label: "Weight loss" },
    { value: "muscle gain", label: "Muscle gain" },
    { value: "toning", label: "Toning" },
  ];
  const sexeEnum = [
    { value: "homme", label: "Homme" },
    { value: "femme", label: "Femme" },
  ];
  const niveauActiviteEnum = [
    { value: "sédentaire", label: "Sédentaire" },
    { value: "légèrement actif", label: "Légèrement actif" },
    { value: "modérément actif", label: "Modérément actif" },
    { value: "très actif", label: "Très actif" },
    { value: "extrêmement actif", label: "Extrêmement actif" },
  ];

  // Step validation helpers
  const validateStep1 = () => {
    if (!email || !motDePasse || !confirmPassword) return "All fields required";
    if (motDePasse !== confirmPassword) return "Passwords do not match";
    return null;
  };
  const validateStep2 = () => {
    if (!prenom || !nom) return "All fields required";
    return null;
  };
  const validateStep3 = () => {
    if (!birthdate || !sexe) return "All fields required";
    return null;
  };
  const validateStep4 = () => {
    if (!taille) return "All fields required";
    return null;
  };
  const validateStep5 = () => {
    if (!poids) return "All fields required";
    return null;
  };

  const handleNext = () => {
    let error = null;
    if (step === 1) error = validateStep1();
    if (step === 2) error = validateStep2();
    if (step === 3) error = validateStep3();
    if (step === 4) error = validateStep4();
    if (step === 5) error = validateStep5();
    if (error) { Alert.alert("Error", error); return; }
    setStep(step + 1);
  };
  const handleBack = () => setStep(step - 1);

  const handleRegister = async () => {
    const error = validateStep4();
    if (error) { Alert.alert("Error", error); return; }
    // Calculate age from birthdate
    let calculatedAge = '';
    if (birthdate) {
      const today = new Date();
      let years = today.getFullYear() - birthdate.getFullYear();
      const m = today.getMonth() - birthdate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
        years--;
      }
      calculatedAge = years.toString();
    }
    const basePayload: any = {
      email, motDePasse, prenom, nom, age: parseInt(calculatedAge), sexe, taille: parseInt(taille), poids: parseInt(poids), role, niveauActivite,
    };
    if (role === "client") {
      basePayload.objectif = objectif;
      basePayload.allergies = allergies;
    } else {
      basePayload.certifications = certifications;
      basePayload.specialites = specialites;
      basePayload.disponible = disponible;
    }
    console.log("Registration payload:", basePayload);
    try {
      await dispatch(registerUser(basePayload));
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert("Registration Failed", error.message || JSON.stringify(error) || "An error occurred");
    }
  };

  const navigateToLogin = () => router.push("/auth/login")

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ImageBackground
          source={require('../../assets/images/bg1.jpeg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.overlay}>
              {/* Line Stepper Indicator */}
              <View style={styles.lineStepperContainer}>
                <View style={styles.line} />
                <View style={styles.dotsRow}>
                  {[1,2,3,4,5,6].map((s) => (
                    <View
                      key={s}
                      style={[styles.lineStepDot, step === s && styles.lineStepDotActive]}
                    />
                  ))}
                </View>
              </View>
              <ThemedText style={styles.title}>Create Account</ThemedText>
              <ThemedText style={styles.subtitle}>Step {step} of 4</ThemedText>
              {error && <ThemedText style={{ color: 'red', marginBottom: 16 }}>{error}</ThemedText>}
              {step === 1 && (
                <>
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.inputLabel}>Password</ThemedText>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        value={motDePasse}
                        onChangeText={setMotDePasse}
                        placeholder="Enter your password"
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.inputLabel}>Confirm Password</ThemedText>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm your password"
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                </>
              )}
              {step === 2 && (
                <>
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.inputLabel}>First Name</ThemedText>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        value={prenom}
                        onChangeText={setPrenom}
                        placeholder="First Name"
                      />
                    </View>
                  </View>
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.inputLabel}>Last Name</ThemedText>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        value={nom}
                        onChangeText={setNom}
                        placeholder="Last Name"
                      />
                    </View>
                  </View>
                </>
              )}
              {step === 3 && (
                <>
                  {/* Birthdate Picker */}
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.inputLabel}>Birthdate</ThemedText>
                    <TouchableOpacity
                      style={[styles.inputWrapper, { paddingVertical: 18 }]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
                      <ThemedText style={styles.textInput}>
                        {birthdate ? birthdate.toLocaleDateString() : 'Select your birthdate'}
                      </ThemedText>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={birthdate || new Date(2000, 0, 1)}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(false);
                          if (selectedDate) {
                            setBirthdate(selectedDate);
                          }
                        }}
                        maximumDate={new Date()}
                      />
                    )}
                  </View>
                  {/* Sexe Picker */}
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.inputLabel}>Sexe</ThemedText>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="male-female" size={20} color="#666" style={styles.inputIcon} />
                      <Picker
                        selectedValue={sexe}
                        onValueChange={setSexe}
                        style={{ flex: 1, color: '#1a1a1a', backgroundColor: 'transparent' }}
                        dropdownIconColor="#F97316"
                      >
                        <Picker.Item label="Sélectionner le sexe" value="" />
                        {sexeEnum.map(opt => (
                          <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  {/* Niveau d'activité Picker */}
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.inputLabel}>Niveau d'activité</ThemedText>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="walk-outline" size={20} color="#666" style={styles.inputIcon} />
                      <Picker
                        selectedValue={niveauActivite}
                        onValueChange={setNiveauActivite}
                        style={{ flex: 1, color: '#1a1a1a', backgroundColor: 'transparent' }}
                        dropdownIconColor="#F97316"
                      >
                        <Picker.Item label="Sélectionner le niveau" value="" />
                        {niveauActiviteEnum.map(opt => (
                          <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </>
              )}
              {step === 4 && (
                <>
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.inputLabel}>Height (cm)</ThemedText>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="arrow-up-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        value={taille}
                        onChangeText={setTaille}
                        placeholder="Height (cm)"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </>
              )}
              {step === 5 && (
                <>
                  <View style={[styles.weightPickerContainer, {
                    backgroundColor: '#F97316',
                    borderRadius: 32,
                    padding: 32,
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }]}> 
                    <ThemedText style={styles.weightLabel}>What’s your current weight right now?</ThemedText>
                    <ThemedText style={styles.weightValueEnhanced}>{poids} Kg</ThemedText>
                    <FlatList
                      data={weightOptions}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.rulerContainer}
                      keyExtractor={item => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => setPoids(item)}>
                          <View style={[styles.rulerMarkEnhanced, poids === item && styles.rulerMarkActiveEnhanced]}>
                            <ThemedText style={poids === item ? styles.rulerMarkTextActiveEnhanced : styles.rulerMarkTextEnhanced}>{item}</ThemedText>
                          </View>
                        </TouchableOpacity>
                      )}
                      getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
                      initialScrollIndex={parseInt(poids) - 30}
                      onScrollToIndexFailed={() => {}}
                    />
                  </View>
                </>
              )}
              {step === 6 && (
                <>
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.inputLabel}>Role</ThemedText>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-circle-outline" size={20} color="#666" style={styles.inputIcon} />
                      <Picker
                        selectedValue={role}
                        onValueChange={setRole}
                        style={{ flex: 1, color: '#1a1a1a', backgroundColor: 'transparent' }}
                        dropdownIconColor="#F97316"
                      >
                        <Picker.Item label="Client" value="client" />
                        <Picker.Item label="Coach" value="coach" />
                        <Picker.Item label="Nutritionniste" value="nutritionniste" />
                      </Picker>
                    </View>
                  </View>
                  {role === "client" && (
                    <>
                      <View style={styles.inputContainer}>
                        <ThemedText style={styles.inputLabel}>Objectif</ThemedText>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="trophy-outline" size={20} color="#666" style={styles.inputIcon} />
                          <Picker
                            selectedValue={objectif}
                            onValueChange={setObjectif}
                            style={{ flex: 1, color: '#1a1a1a', backgroundColor: 'transparent' }}
                            dropdownIconColor="#F97316"
                          >
                            <Picker.Item label="Sélectionner l'objectif" value="" />
                            {objectifsEnum.map(opt => (
                              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      <View style={styles.inputContainer}>
                        <ThemedText style={styles.inputLabel}>Allergies</ThemedText>
                        <TagInput
                          value={allergies}
                          onChange={tags => setAllergies(tags.filter(tag => allergiesEnum.some(a => a.value === tag)))}
                          placeholder="Ajouter une allergie et appuyer sur Entrée"
                          style={{ marginTop: 4 }}
                        />
                        {/* Show allowed allergies as chips for user reference */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                          {allergiesEnum.map(a => (
                            <View key={a.value} style={{ backgroundColor: '#fff3e6', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, margin: 2 }}>
                              <ThemedText style={{ color: '#F97316', fontSize: 12 }}>{a.label}</ThemedText>
                            </View>
                          ))}
                        </View>
                      </View>
                    </>
                  )}
                  {(role === "coach" || role === "nutritionniste") && (
                    <>
                      <View style={styles.inputContainer}>
                        <ThemedText style={styles.inputLabel}>Certifications</ThemedText>
                        <TagInput
                          value={certifications}
                          onChange={setCertifications}
                          placeholder="Add a certification and press enter"
                          style={{ marginTop: 4 }}
                        />
                      </View>
                      <View style={styles.inputContainer}>
                        <ThemedText style={styles.inputLabel}>Specialties</ThemedText>
                        <TagInput
                          value={specialites}
                          onChange={setSpecialites}
                          placeholder="Add a specialty and press enter"
                          style={{ marginTop: 4 }}
                        />
                      </View>
                      <View style={styles.inputContainer}>
                        <ThemedText style={styles.inputLabel}>Available</ThemedText>
                        <View style={[styles.inputWrapper, { backgroundColor: 'transparent', borderWidth: 0 }]}>  
                          <Switch value={disponible} onValueChange={setDisponible} />
                        </View>
                      </View>
                    </>
                  )}
                </>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                {step > 1 && (
                  <TouchableOpacity style={[styles.signInButton, { flex: 1, marginRight: 10 }]} onPress={handleBack} disabled={loading}>
                    <ThemedText style={styles.signInButtonText}>Back</ThemedText>
                  </TouchableOpacity>
                )}
                {step < 6 && (
                  <TouchableOpacity style={[styles.signInButton, { flex: 1 }]} onPress={handleNext} disabled={loading}>
                    <ThemedText style={styles.signInButtonText}>Next</ThemedText>
                  </TouchableOpacity>
                )}
                {step === 6 && (
                  <TouchableOpacity style={[styles.signInButton, loading && styles.buttonDisabled, { flex: 1 }]} onPress={handleRegister} disabled={loading}>
                    <ThemedText style={styles.signInButtonText}>{loading ? "Creating Account..." : "Create Account"}</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={navigateToLogin} style={styles.linkContainer}>
                <ThemedText style={styles.linkText}>Already have an account? Sign In</ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ImageBackground>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    paddingTop: 20,
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
  },
  signInButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    color: "#FF6B35",
    fontSize: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
    gap: 8,
  },
  stepperItem: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeStepDot: {
    backgroundColor: '#F97316',
  },
  stepNumber: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeStepNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepLabel: {
    color: '#888',
    fontSize: 12,
  },
  activeStepLabel: {
    color: '#F97316',
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  toggleButtonActive: {
    backgroundColor: '#F97316',
  },
  toggleText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 16,
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  genderToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  genderButtonActive: {
    backgroundColor: '#F97316',
  },
  genderText: {
    marginLeft: 8,
    color: '#888',
    fontWeight: '600',
    fontSize: 16,
  },
  genderTextActive: {
    marginLeft: 8,
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  weightPickerContainer: {
    
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  weightLabel: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  weightValue: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  weightValueEnhanced: {
    fontSize: 50,
    paddingTop: 24,
    paddingBottom: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    letterSpacing: 1,
  },
  rulerContainer: {
    marginTop: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  rulerMark: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  rulerMarkActive: {
    borderBottomColor: '#fff',
  },
  rulerMarkText: {
    color: '#fff',
    fontSize: 18,
    opacity: 0.5,
  },
  rulerMarkTextActive: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    opacity: 1,
  },
  rulerMarkEnhanced: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: 2,
  },
  rulerMarkActiveEnhanced: {
    borderBottomColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
  },
  rulerMarkTextEnhanced: {
    color: '#fff',
    fontSize: 20,
    opacity: 0.5,
    fontWeight: '600',
  },
  rulerMarkTextActiveEnhanced: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    opacity: 1,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  lineStepperContainer: {
    marginTop: 24,
    marginBottom: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  line: {
    position: 'absolute',
    top: '50%',
    left: 24,
    right: 24,
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    zIndex: 0,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  lineStepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#eee',
    borderWidth: 2,
    borderColor: '#fff',
  },
  lineStepDotActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
});
