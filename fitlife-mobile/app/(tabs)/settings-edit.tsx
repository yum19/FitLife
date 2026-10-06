import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import TagInput from "@/components/ui/TagInput";
import { RootState } from "@/redux/store";
import { authService } from "@/services/authService";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from 'expo-image-picker';
import { useState, useRef, useCallback } from "react";
import { 
  Image, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  View,
  ActivityIndicator,
  Alert
} from "react-native";
import { useSelector } from "react-redux";
import { Ionicons } from '@expo/vector-icons';

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
  { value: "perte_de_poids", label: "Perte de poids" },
  { value: "prise_de_masse", label: "Prise de masse" },
  { value: "maintien", label: "Maintien" },
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

interface FormErrors {
  prenom?: string;
  nom?: string;
  email?: string;
  age?: string;
  taille?: string;
  poids?: string;
  sexe?: string;
  niveauActivite?: string;
}

export default function SettingsEditScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  
  // Form state
  const [prenom, setPrenom] = useState(user?.prenom || "");
  const [nom, setNom] = useState(user?.nom || "");
  const [email, setEmail] = useState(user?.email || "");
  const [age, setAge] = useState(user?.age?.toString() || "");
  const [sexe, setSexe] = useState(user?.sexe || "");
  const [taille, setTaille] = useState(user?.taille?.toString() || "");
  const [poids, setPoids] = useState(user?.poids?.toString() || "");
  const [objectif, setObjectif] = useState(user?.objectif || "");
  const [niveauActivite, setNiveauActivite] = useState(user?.niveauActivite || "");
  const [allergies, setAllergies] = useState<string[]>(user?.allergies || []);
  const [certifications, setCertifications] = useState<string[]>(user?.certifications || []);
  const [specialites, setSpecialites] = useState<string[]>(user?.specialites || []);
  const [disponible, setDisponible] = useState(user?.disponible || false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSaveEnabled, setIsSaveEnabled] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || "");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // web only

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      // Trigger file input click
      fileInputRef.current?.click();
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    }
  };

  // Handle file input change (web only)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setPhotoUri(URL.createObjectURL(file));
    }
  };

  // Validation function
  const validateForm = useCallback(() => {
    const errors: FormErrors = {};
    let isValid = true;

    if (!prenom.trim()) {
      errors.prenom = "Le prénom est requis";
      isValid = false;
    }

    if (!nom.trim()) {
      errors.nom = "Le nom est requis";
      isValid = false;
    }

    if (!email.trim()) {
      errors.email = "L'email est requis";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Format d'email invalide";
      isValid = false;
    }

    if (age && (isNaN(Number(age)) || Number(age) < 13 || Number(age) > 120)) {
      errors.age = "L'âge doit être entre 13 et 120 ans";
      isValid = false;
    }

    if (taille && (isNaN(Number(taille)) || Number(taille) < 100 || Number(taille) > 250)) {
      errors.taille = "La taille doit être entre 100 et 250 cm";
      isValid = false;
    }

    if (poids && (isNaN(Number(poids)) || Number(poids) < 30 || Number(poids) > 300)) {
      errors.poids = "Le poids doit être entre 30 et 300 kg";
      isValid = false;
    }

    setFormErrors(errors);
    setIsSaveEnabled(isValid);
    return isValid;
  }, [prenom, nom, email, age, taille, poids]);

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Erreur", "Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Prepare form data for multipart upload
      const formData = new FormData();
      formData.append('prenom', prenom.trim());
      formData.append('nom', nom.trim());
      formData.append('email', email.trim());
      formData.append('age', age);
      formData.append('sexe', sexe);
      formData.append('taille', taille);
      formData.append('poids', poids);
      formData.append('objectif', objectif);
      formData.append('niveauActivite', niveauActivite);
      allergies.forEach(a => formData.append('allergies', a));
      certifications.forEach(c => formData.append('certifications', c));
      specialites.forEach(s => formData.append('specialites', s));
      formData.append('disponible', disponible ? 'true' : 'false');
      if (photoUri) {
        if (Platform.OS === 'web') {
          // @ts-ignore
          const fileInput = fileInputRef.current;
          if (fileInput && fileInput.files && fileInput.files[0]) {
            formData.append('profilePhoto', fileInput.files[0]);
          }
        } else {
          const filename = photoUri.split('/').pop() || 'profile.jpg';
          const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;
          formData.append('profilePhoto', { uri: photoUri, name: filename, type } as any);
        }
      }
      await authService.updateUserProfile(user!._id, formData);
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Hidden file input for web */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Edit Profile</ThemedText>
        {/* Profile Photo Picker and Preview */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          {photoUri || profilePhoto ? (
            <Image
              source={
                photoUri
                  ? { uri: photoUri }
                  : profilePhoto
                    ? { uri: `http://192.168.7.5:5000${profilePhoto}` }
                    : require('@/assets/images/logo.png')
              }
              style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 8 }}
            />
          ) : (
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', marginBottom: 8, alignItems: 'center', justifyContent: 'center' }}>
              <ThemedText style={{ fontSize: 36, color: '#F97316' }}>{user?.prenom?.[0] || ''}{user?.nom?.[0] || ''}</ThemedText>
            </View>
          )}
          <TouchableOpacity onPress={pickImage} style={{ backgroundColor: '#F97316', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }}>
            <ThemedText style={{ color: '#fff', fontWeight: '600' }}>{photoUri || profilePhoto ? 'Changer la photo' : 'Ajouter une photo'}</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <View style={styles.halfInputContainer}>
            <ThemedText style={styles.label}>
              Prénom <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.input, formErrors.prenom && styles.inputError]}
              value={prenom}
              onChangeText={text => {
                setPrenom(text);
                setFormErrors(prev => ({ ...prev, prenom: undefined }));
              }}
              placeholder="Prénom"
            />
            {formErrors.prenom && (
              <ThemedText style={styles.errorText}>{formErrors.prenom}</ThemedText>
            )}
          </View>
          <View style={styles.halfInputContainer}>
            <ThemedText style={styles.label}>
              Nom <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.input, formErrors.nom && styles.inputError]}
              value={nom}
              onChangeText={text => {
                setNom(text);
                setFormErrors(prev => ({ ...prev, nom: undefined }));
              }}
              placeholder="Nom"
            />
            {formErrors.nom && (
              <ThemedText style={styles.errorText}>{formErrors.nom}</ThemedText>
            )}
          </View>
        </View>
        <ThemedText style={styles.label}>
          Email <ThemedText style={styles.required}>*</ThemedText>
        </ThemedText>
        <TextInput
          style={[styles.input, formErrors.email && styles.inputError]}
          value={email}
          onChangeText={text => {
            setEmail(text);
            setFormErrors(prev => ({ ...prev, email: undefined }));
          }}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {formErrors.email && (
          <ThemedText style={styles.errorText}>{formErrors.email}</ThemedText>
        )}
        <View style={styles.row}>
          <View style={styles.halfInputContainer}>
            <ThemedText style={styles.label}>Âge</ThemedText>
            <TextInput
              style={[styles.input, formErrors.age && styles.inputError]}
              value={age}
              onChangeText={text => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setAge(numericValue);
                setFormErrors(prev => ({ ...prev, age: undefined }));
              }}
              placeholder="Âge"
              keyboardType="numeric"
              maxLength={3}
            />
            {formErrors.age && (
              <ThemedText style={styles.errorText}>{formErrors.age}</ThemedText>
            )}
          </View>
          <View style={styles.halfInputContainer}>
            <ThemedText style={styles.label}>
              Sexe <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <View style={[styles.pickerContainer, formErrors.sexe && styles.inputError]}>
              <Ionicons name="male-female" size={20} color="#F97316" style={styles.pickerIcon} />
              <Picker
                selectedValue={sexe}
                onValueChange={(value) => {
                  setSexe(value);
                  setFormErrors(prev => ({ ...prev, sexe: undefined }));
                }}
                style={styles.picker}
                dropdownIconColor="#F97316"
              >
                <Picker.Item label="Sélectionner le sexe" value="" />
                {sexeEnum.map(opt => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>
            {formErrors.sexe && (
              <ThemedText style={styles.errorText}>{formErrors.sexe}</ThemedText>
            )}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInputContainer}>
            <ThemedText style={styles.label}>Taille (cm)</ThemedText>
            <TextInput
              style={[styles.input, formErrors.taille && styles.inputError]}
              value={taille}
              onChangeText={text => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setTaille(numericValue);
                setFormErrors(prev => ({ ...prev, taille: undefined }));
              }}
              placeholder="Taille en cm"
              keyboardType="numeric"
              maxLength={3}
            />
            {formErrors.taille && (
              <ThemedText style={styles.errorText}>{formErrors.taille}</ThemedText>
            )}
          </View>
          <View style={styles.halfInputContainer}>
            <ThemedText style={styles.label}>Poids (kg)</ThemedText>
            <TextInput
              style={[styles.input, formErrors.poids && styles.inputError]}
              value={poids}
              onChangeText={text => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setPoids(numericValue);
                setFormErrors(prev => ({ ...prev, poids: undefined }));
              }}
              placeholder="Poids en kg"
              keyboardType="numeric"
              maxLength={3}
            />
            {formErrors.poids && (
              <ThemedText style={styles.errorText}>{formErrors.poids}</ThemedText>
            )}
          </View>
        </View>

        <View style={styles.fullInputContainer}>
          <ThemedText style={styles.label}>Niveau d'activité</ThemedText>
          <View style={[styles.pickerContainer, formErrors.niveauActivite && styles.inputError]}>
            <Ionicons name="walk-outline" size={20} color="#F97316" style={styles.pickerIcon} />
            <Picker
              selectedValue={niveauActivite}
              onValueChange={(value) => {
                setNiveauActivite(value);
                setFormErrors(prev => ({ ...prev, niveauActivite: undefined }));
              }}
              style={styles.picker}
              dropdownIconColor="#F97316"
            >
              <Picker.Item label="Sélectionner le niveau" value="" />
              {niveauActiviteEnum.map(opt => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </Picker>
          </View>
          {formErrors.niveauActivite && (
            <ThemedText style={styles.errorText}>{formErrors.niveauActivite}</ThemedText>
          )}
        </View>
        <View style={{ marginTop: 16 }}>
          <ThemedText style={styles.label}>Objectif</ThemedText>
          <View style={styles.pickerContainer}>
            <Ionicons name="trophy-outline" size={20} color="#F97316" style={styles.pickerIcon} />
            <Picker
              selectedValue={objectif}
              onValueChange={setObjectif}
              style={styles.picker}
              dropdownIconColor="#F97316"
            >
              <Picker.Item label="Sélectionner l'objectif" value="" />
              {objectifsEnum.map(opt => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </Picker>
          </View>
        </View>
        <ThemedText style={styles.label}>Allergies</ThemedText>
        <TagInput
          value={allergies}
          onChange={tags => setAllergies(tags.filter(tag => allergiesEnum.some(a => a.value === tag)))}
          placeholder="Ajouter une allergie et appuyer sur Entrée"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {allergiesEnum.map(a => (
            <View key={a.value} style={{ backgroundColor: '#fff3e6', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, margin: 2 }}>
              <ThemedText style={{ color: '#F97316', fontSize: 12 }}>{a.label}</ThemedText>
            </View>
          ))}
        </View>
        { (user?.role === "coach" || user?.role === "nutritionniste") && (
          <>
            <ThemedText style={styles.label}>Certifications</ThemedText>
            <TagInput value={certifications} onChange={setCertifications} placeholder="Add a certification and press enter" />
            <ThemedText style={styles.label}>Specialties</ThemedText>
            <TagInput value={specialites} onChange={setSpecialites} placeholder="Add a specialty and press enter" />
          </>
        )}
        {/* Available toggle can be added here if needed */}
        {error ? (
          <View style={styles.messageContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <ThemedText style={styles.error}>{error}</ThemedText>
          </View>
        ) : null}
        {success ? (
          <View style={styles.messageContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <ThemedText style={styles.success}>{success}</ThemedText>
          </View>
        ) : null}
        <TouchableOpacity 
          style={[
            styles.button,
            loading && styles.buttonDisabled,
            !isSaveEnabled && styles.buttonDisabled
          ]} 
          onPress={handleSubmit} 
          disabled={loading || !isSaveEnabled}
        >
          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          )}
          <ThemedText style={styles.buttonText}>
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.note}>* Champs obligatoires</ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF6F0',
    paddingHorizontal: 0,
  },
  required: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  scroll: {
    padding: 24,
    paddingBottom: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#F97316',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 2, // less space before field
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  halfInputContainer: {
    flex: 1,
    minWidth: 0,
  },
  fullInputContainer: {
    width: '100%',
    marginTop: 16,
  },
  input: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  button: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
    marginBottom:40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  error: {
    color: '#FF3B30',
    fontSize: 15,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  success: {
    color: '#34C759',
    fontSize: 15,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f7f3',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 0, // reduce vertical padding
    marginTop: 8, // more space from label
    marginBottom: 4,
    height: 48, // match input height
    shadowColor: '#F97316',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pickerIcon: {
    marginRight: 8,
    alignSelf: 'center', // ensure vertical centering
  },
  picker: {
    flex: 1,
    color: '#1a1a1a',
    backgroundColor: 'transparent',
    borderWidth: 0,
    minHeight: 36,
    height: 48,
    width: '100%',
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  // For web, add this CSS to your global styles (e.g., in app/_app.js or a CSS file):
  // select { appearance: none; -webkit-appearance: none; -moz-appearance: none; border: none; background: transparent; outline: none; }
}); 