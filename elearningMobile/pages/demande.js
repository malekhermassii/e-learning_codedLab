import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,

} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addDemande } from "../redux/slices/demandeSlice";
import { useTranslation } from 'react-i18next';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
const validationSchema = Yup.object().shape({
  name: Yup.string().required("name is required"),
  email: Yup.string().email("Email invalid").required("email is required"),
  country: Yup.string().required("country is required"),
  speciality: Yup.string().required("speciality is required"),
  birthDate: Yup.date().required("birthDate is required"),
  topic: Yup.string().required("topic is required"),
});

export default function Demande() {
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigation = useNavigation();

  // Gérer la sélection du document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf"],
        copyToCacheDirectory: true,
      });

      console.log("Document picker result:", JSON.stringify(result, null, 2));

      // Vérifier le format retourné par DocumentPicker (nouveau format avec assets)
      if (result.assets && result.assets.length > 0) {
        const fileAsset = result.assets[0];
        console.log("Fichier sélectionné:", fileAsset);
        setCv(fileAsset);
        Alert.alert(t('demande.alerts.success'), t('demande.alerts.uploadSuccess') + fileAsset.name);
      } else if (result.type === "success") {
        // Ancien format pour compatibilité
        setCv(result);
        Alert.alert(t('demande.alerts.success'), t('demande.alerts.uploadSuccess') + result.name);
      } else if (result.canceled) {
        console.log("Selection canceled");
      }
    } catch (error) {
      console.error("Error during document selection:", error);
      Alert.alert(t('demande.alerts.error'), t('demande.alerts.uploadError'));
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (values, { resetForm }) => {
    try {
      if (!cv) {
        Alert.alert(t('demande.alerts.error'), t('demande.alerts.cvRequired'));
        return;
      }
      setLoading(true);
      const formData = new FormData();
      // Ajouter les champs de base
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("country", values.country);
      formData.append("speciality", values.speciality);
      formData.append("birthDate", values.birthDate);
      formData.append("topic", values.topic);

      // Préparer le fichier CV en fonction du format détecté
      let fileInfo;
      
      if (cv.uri) {
        // Format standard
        fileInfo = {
          uri: Platform.OS === 'android' ? cv.uri : cv.uri.replace('file://', ''),
          name: cv.name || "document.pdf",
          type: cv.mimeType || "application/pdf"
        };
      } else if (cv.assets && cv.assets[0]) {
        // Format avec assets
        const asset = cv.assets[0];
        fileInfo = {
          uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
          name: asset.name || "document.pdf",
          type: asset.mimeType || "application/pdf"
        };
      }
      
      if (!fileInfo) {
        Alert.alert(t('demande.alerts.error'), t('demande.alerts.fileFormatError'));
        setLoading(false);
        return;
      }
      
      console.log("File to send:", JSON.stringify(fileInfo, null, 2));
      formData.append("cv", fileInfo);
      
      console.log("FormData prepared with CV");

      // Envoi de la demande
      const response = await axios.post(
        "http://192.168.70.148:4000/demandes",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Accept": "application/json",
          }
        }
      );

      console.log("Server response:", JSON.stringify(response.data, null, 2));

      if (response.data) {
        dispatch(addDemande(response.data.demande));
        Alert.alert(t('demande.alerts.success'), t('demande.alerts.submissionSuccess'));
        resetForm();
      }
    } catch (error) {
      console.error("Error during request sending:", error.response || error);
      Alert.alert(
        t('demande.alerts.error'),
        error.response?.data?.message || error.message || t('demande.alerts.submissionError')
      );
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de date de naissance
  const handleBirthDateChange = (text, setFieldValue) => {
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
    setFieldValue('birthDate', formattedDate);
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <View style={styles.backButton}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.scrollView}>
        <Formik
          initialValues={{
            name: "",
            email: "",
            country: "",
            speciality: "",
            birthDate: "",
            topic: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
            <>
              <Text style={styles.title}>{t('demande.title')}</Text>
              <Text style={styles.subtitle}>{t('demande.subtitle')}</Text>

              {/* Nom */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('demande.fullName')}</Text>
                <View style={styles.inputField}>
                  <MaterialIcons name="person" size={20} color="#6E6E6E" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('demande.placeholders.fullName')}
                    onChangeText={handleChange("name")}
                    onBlur={handleBlur("name")}
                    value={values.name}
                  />
                </View>
                {touched.name && errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('demande.email')}</Text>
                <View style={styles.inputField}>
                  <MaterialIcons name="email" size={20} color="#6E6E6E" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('demande.placeholders.email')}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    value={values.email}
                    keyboardType="email-address"
                  />
                </View>
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Pays */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('demande.country')}</Text>
                <View style={styles.inputField}>
                  <MaterialIcons name="location-on" size={20} color="#6E6E6E" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('demande.placeholders.country')}
                    onChangeText={handleChange("country")}
                    onBlur={handleBlur("country")}
                    value={values.country}
                  />
                </View>
                {touched.country && errors.country && (
                  <Text style={styles.errorText}>{errors.country}</Text>
                )}
              </View>

              {/* Speciality */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('demande.specialty')}</Text>
                <View style={styles.inputField}>
                  <MaterialIcons name="school" size={20} color="#6E6E6E" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('demande.placeholders.specialty')}
                    onChangeText={handleChange("speciality")}
                    onBlur={handleBlur("speciality")}
                    value={values.speciality}
                  />
                </View>
                {touched.speciality && errors.speciality && (
                  <Text style={styles.errorText}>{errors.speciality}</Text>
                )}
              </View>

              {/* Date de naissance */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('demande.birthDate')}</Text>
                <View style={styles.inputField}>
                  <MaterialIcons name="event" size={20} color="#6E6E6E" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('demande.placeholders.birthDate')}
                    onChangeText={text => handleBirthDateChange(text, setFieldValue)}
                    onBlur={handleBlur("birthDate")}
                    value={values.birthDate}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
                {touched.birthDate && errors.birthDate && (
                  <Text style={styles.errorText}>{errors.birthDate}</Text>
                )}
              </View>

              {/* Sujet */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('demande.topic')}</Text>
                <View style={styles.inputField}>
                  <MaterialIcons name="subject" size={20} color="#6E6E6E" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('demande.placeholders.topic')}
                    onChangeText={handleChange("topic")}
                    onBlur={handleBlur("topic")}
                    value={values.topic}
                    multiline
                  />
                </View>
                {touched.topic && errors.topic && (
                  <Text style={styles.errorText}>{errors.topic}</Text>
                )}
              </View>

              {/* Upload CV */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('demande.cv')}</Text>
                <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                  <MaterialIcons name="attach-file" size={20} color="#1B45B4" />
                  <Text style={styles.uploadButtonText}>
                    {cv ? (cv.name || (cv.assets && cv.assets[0] ? cv.assets[0].name : "")) : t('demande.uploadCv')}
                  </Text>
                </TouchableOpacity>
                {cv && (
                  <Text style={styles.cvSelected}>
                    Selected file: {cv.name || (cv.assets && cv.assets[0] ? cv.assets[0].name : "")}
                  </Text>
                )}
              </View>

              {/* Bouton de soumission */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('demande.submit')}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    padding: 20,
    marginBottom: 70,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1B45B4",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F8FE",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1B45B4",
    borderStyle: "dashed",
  },
  uploadButtonText: {
    marginLeft: 10,
    color: "#1B45B4",
    fontSize: 16,
  },
  cvSelected: {
    fontSize: 12,
    color: "green",
    marginTop: 5,
    textAlign: "center",
  },
  header: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    paddingTop:30
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop:10 
  },
  backButtonText: {
    color: "#333",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    marginTop:7

  },
  submitButton: {
    backgroundColor: "#1B45B4",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});