import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { updateProfil, setUserToken } from "../redux/slices/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from 'react-i18next';
import defaultProfileImage from '../assets/default (2).png';

// Custom Alert Component
const CustomAlert = ({ visible, title, message, onClose, type = "success" }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <View style={[styles.alertIconContainer, 
            { backgroundColor: type === "success" ? "#4CAF50" : "#F44336" }]}>
            <AntDesign 
              name={type === "success" ? "checkcircleo" : "closecircleo"} 
              size={30} 
              color="#fff" 
            />
          </View>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <TouchableOpacity style={styles.alertButton} onPress={onClose}>
            <Text style={styles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Validation schema
const validationSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  telephone: Yup.string()
    .matches(/^[0-9]{8}$/, "Le numéro de téléphone doit contenir 8 chiffres")
    .required("Le numéro de téléphone est requis"),
  dateNaissance: Yup.string()
    .matches(/^\d{2}-\d{2}-\d{4}$/, "Format de date invalide (JJ-MM-AAAA)")
    .test('is-valid-date', 'Date invalide', function(value) {
      if (!value) return false;
      const [day, month, year] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date && date.getMonth() + 1 === month && date.getDate() === day;
    })
    .test('is-not-future', 'La date ne peut pas être dans le futur', function(value) {
      if (!value) return false;
      const [day, month, year] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date <= new Date();
    })
    .required("Date de naissance requise"),
  newPassword: Yup.string().min(6, "Minimum 6 caractères"),
  confirmPassword: Yup.string().oneOf(
    [Yup.ref("newPassword"), null],
    "Les mots de passe ne correspondent pas"
  ),
});

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.userInfo);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [initialValues, setInitialValues] = useState({
    name: "",
    email: "",
    telephone: "",
    dateNaissance: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { t } = useTranslation();
  
  // Custom alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success"
  });

  // show alert
  const showAlert = (title, message, type = "success") => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  // format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error(t('profile.errorDateFormatting'), error);
      return "";
    }
  };

  // parse date
  const parseDate = (dateString) => {
    if (!dateString) return "";
    try {
      const [day, month, year] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error("Erreur de parsing de date:", error);
      return "";
    }
  };

  // handle date change
  const handleDateChange = (text, handleChange) => {
    // Supprimer tous les caractères non numériques
    const numbers = text.replace(/\D/g, '');
    
    // Formater la date au fur et à mesure
    let formattedDate = '';
    if (numbers.length > 0) {
      formattedDate = numbers.slice(0, 2);
      if (numbers.length > 2) {
        formattedDate += '-' + numbers.slice(2, 4);
        if (numbers.length > 4) {
          formattedDate += '-' + numbers.slice(4, 8);
        }
      }
    }
    
    handleChange('dateNaissance')(formattedDate);
  };
  
  // handle phone change
  const handlePhoneChange = (text, handleChange) => {
    // Supprimer tous les caractères non numériques
    const numbers = text.replace(/\D/g, '');
    
    // Limiter à 8 chiffres
    const formattedPhone = numbers.slice(0, 8);
    
    handleChange('telephone')(formattedPhone);
  };

  useEffect(() => {
    if (user) {
      setInitialValues({
        name: user.name || "",
        email: user.email || "",
        telephone: user.telephone || "",
        dateNaissance: user.dateNaissance ? formatDate(user.dateNaissance) : "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  // get image
  useEffect(() => {
    const getImage = async () => {
      const image = await AsyncStorage.getItem('image');
      if (image && image !== "") {
        setProfileImage(image); // juste le nom du fichier
      } else {
        setProfileImage(null);
      }
    };
    getImage();

    console.log("profileImage",profileImage);
  }, []);

  // pick image
  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert(t('profile.error'), t('profile.galleryPermissionDenied'), "error");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      showAlert(t('profile.error'), t('profile.imageSelectionError'), "error");
    }
  };

  // handle submit
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setLoading(true);
      const formData = new FormData();

      // Ajouter les champs de base
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("telephone", values.telephone);
      formData.append("dateNaissance", parseDate(values.dateNaissance));

      // Gérer le mot de passe si fourni
      if (values.newPassword) {
        formData.append("password", values.newPassword);
      }

      // Gérer l'image si une nouvelle a été sélectionnée
      if (profileImage && !profileImage.includes("http")) {
        const filename = profileImage.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";

        formData.append("image", {
          uri: profileImage,
          name: filename,
          type: type,
        });
      }

      // Récupérer le token depuis AsyncStorage
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Token non trouvé");
      }

      const response = await axios.put(
        "http://192.168.70.148:4000/profile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(t('profile.responseAfterUpdatingProfile'),response.data);
      // Mettre à jour le token si un nouveau est fourni
      if (response.data.token) {
        await AsyncStorage.setItem("userToken", response.data.token);
        dispatch(setUserToken({ token: response.data.token,user: response.data })); // Mettre à jour Redux
        
      }

      // Mettre à jour le profil dans Redux
      dispatch(updateProfil(response.data));

      await AsyncStorage.setItem("image", response.data.image);

      // Mettre à jour AsyncStorage avec les nouvelles informations
      await AsyncStorage.setItem("user", JSON.stringify(response.data));

      // Mettre à jour l'image de profil si une nouvelle image a été téléchargée
      if (response.data.image) {
        setProfileImage("http://192.168.70.148:4000/Public/Images/" + response.data.image);
      }

      // Mettre à jour les valeurs initiales avec les nouvelles données
      setInitialValues({
        name: response.data.name || "",
        email: response.data.email || "",
        telephone: response.data.telephone || "",
        dateNaissance: response.data.dateNaissance ? formatDate(response.data.dateNaissance) : "",
        newPassword: "",
        confirmPassword: "",
      });
      showAlert(t('profile.success'), t('profile.profileUpdated'), "success");
      resetForm();
    } catch (error) {
      console.error(t('profile.errorUpdatingProfile'), error);
      showAlert(t('profile.error'), t('profile.updateError'), "error");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image
            source={
              profileImage
                ? profileImage.startsWith('http') || profileImage.startsWith('file')
                  ? { uri: profileImage }
                  : { uri: `http://192.168.70.148:4000/Public/Images/${profileImage}` }
                : defaultProfileImage
            }
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.imageButtonText}>{t('profile.changePhoto')}</Text>
          </TouchableOpacity>
        </View>

        <Formik
          initialValues={initialValues}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.form}>
              {[
                "name",
                "email",
                "telephone",
                "dateNaissance",
                "newPassword",
                "confirmPassword",
              ].map((field, index) => (
                <View style={styles.inputContainer} key={index}>
                  <Text style={styles.label}>
                    {t(`profile.${field}`)}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      field === "email" && { backgroundColor: "#e5e7eb", color: "#a1a1aa" }
                    ]}
                    onChangeText={(text) => field === "telephone" ? handlePhoneChange(text, handleChange) : handleChange(field)(text)}
                    onBlur={handleBlur(field)}
                    value={values[field]}
                    placeholder={t(`profile.placeholders.${field}`)}
                    secureTextEntry={field.toLowerCase().includes("password")}
                    keyboardType={
                      field === "email" 
                        ? "email-address" 
                        : field === "telephone" 
                        ? "phone-pad" 
                        : field === "dateNaissance"
                        ? "numeric"
                        : "default"
                    }
                    maxLength={field === "dateNaissance" ? 10 : field === "telephone" ? 8 : undefined}
                    autoCapitalize={field.toLowerCase().includes("password") ? "none" : "default"}
                    editable={field !== "email"}
                  />
                  {touched[field] && errors[field] && (
                    <Text style={styles.errorText}>
                      {t(errors[field])}
                    </Text>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={[styles.updateButton, loading && styles.disabledButton]}
                onPress={async () => {
                  await handleSubmit();
                }}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.updateButtonText}>{t('profile.update')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>
        
        {/* Custom Alert Component */}
        <CustomAlert 
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => setAlertVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", marginBottom: 70 },
  header: {
    padding: 20,
    backgroundColor: "#3949AB",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  imageContainer: { alignItems: "center", marginVertical: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 15 },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#3949AB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3949AB",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  imageButtonText: { color: "#fff", marginLeft: 8, fontSize: 16 },
  form: { padding: 20 },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 16, color: "#333", marginBottom: 5 },
  input: {
    backgroundColor: "#F6F8FC",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: "#3949AB",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  updateButtonText: { color: "#fff", fontSize: 16 },
  disabledButton: { opacity: 0.6 },
  
  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  alertIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  alertMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666'
  },
  alertButton: {
    backgroundColor: '#3949AB',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  errorText: {
    color: "#F44336",
    fontSize: 12,
    marginTop: 5,
  },
});

export default Profile;