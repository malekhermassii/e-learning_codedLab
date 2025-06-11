import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Fontisto from "@expo/vector-icons/Fontisto";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Formik } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { setUserToken } from "../redux/slices/authSlice";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';



// Validation schema for login
const loginValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email("validation.invalidEmail")
    .required("validation.emailRequired"),
  password: Yup.string()
    .min(6, "validation.passwordMinLength")
    .required("validation.passwordRequired"),
});

// Validation schema for register
const registerValidationSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, "validation.nameMinLength")
    .required("validation.nameRequired"),
  email: Yup.string()
    .email("validation.invalidEmail")
    .required("validation.emailRequired"),
  password: Yup.string()
    .min(6, "validation.passwordMinLength")
    .required("validation.passwordRequired"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "validation.passwordsMustMatch")
    .required("validation.confirmPasswordRequired"),
});


const getPushToken = async () => {
  try {
    // Vérifier d'abord les permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission de notification refusée');
      return null;
    }

    console.log('Tentative d\'obtention du token de notification...');
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: "1ae2a767-7fde-4a5b-8d6a-0382d861a51a"
    });

    console.log('Token de notification obtenu:', token);
    return token;
  } catch (error) {
    console.log("Erreur détaillée lors de l'obtention du token:", error);
    Alert.alert(
      "Erreur",
      "Impossible d'obtenir le token de notification: " + error.message,
      [{ text: "OK" }]
    );
    return null;
  }
};


const Login = ({ navigation, promptAsync }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [expoPushToken, setExpoPushToken] = useState(null);

  // Configuration des notifications
  useEffect(() => {
    const configureNotifications = async () => {
      try {
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
        console.log(t('login.notificationConfigurationSuccess'));
      } catch (error) {
        console.log(t('login.notificationConfigurationError'), error);
      }
    };
    configureNotifications();
  }, []);

  // Initial values based on active tab
  const initialValues = {
    login: {
      email: "",
      password: "",
    },
    register: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  };


  // Function for login
  const handleLogin = async (values) => {
    try {

      console.log("Tentative de connexion avec:", values.email);
      const expoPushToken = await getPushToken();
      const response = await axios.post("http://192.168.70.148:4000/login", {
        email: values.email,
        password: values.password,
        expoPushToken: expoPushToken.data,
        
      });

      console.log(t('login.serverResponse'), JSON.stringify(response.data));

      const { token, ...userData } = response.data;

      console.log(t('login.userDataReceived'), userData);
      

      if (!token) {
        throw new Error(t("alerts.tokenError"));
      }

      await AsyncStorage.setItem("userToken", token);

      // Sauvegarde des informations complètes de l'utilisateur
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      await AsyncStorage.setItem('image', userData.image);

      // Mettre à jour Redux avec les données reçues
      dispatch(setUserToken({ token, user: userData }));

      Alert.alert("Connection", t("alerts.loginSuccess"), [
        {
          text: "OK",
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: "DrawerMenu" }],
          }),
        },
      ]);

      if (userData._id) {
        await AsyncStorage.setItem("userId", userData._id);
      }
    } catch (error) {
      console.error("Login error:", error.message);
      console.error("Error details:", error.response?.data);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        t("alerts.incorrectCredentials");
      Alert.alert(t("alerts.loginFailed"), errorMessage);
    }
  };

  // Function for register
  const handleRegister = async (values) => {
    try {
      const response = await axios.post(
        "http://192.168.70.148:4000/register",
        {
          name: values.name,
          email: values.email,
          password: values.password,
        }
      );

      const { token, ...userData } = response.data;

      if (!token) {
        throw new Error(t("alerts.tokenError"));
      }

      await AsyncStorage.setItem("userToken", token);

      // Sauvegarde des informations complètes de l'utilisateur
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      // Mettre à jour Redux avec les données reçues
      dispatch(setUserToken({ token, user: userData }));

      Alert.alert(
        t("alerts.registrationSuccess"),
        t("alerts.registrationSuccess"),
        [
          {
            text: "OK",
            onPress: () => {

              setActiveTab("login")
            }

          },
        ]
      );
    } catch (error) {
      console.error("Registration error:", error.message);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        t("alerts.registrationError");
      Alert.alert(t("alerts.registrationFailed"), errorMessage);
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>
           {activeTab === "login"
              ? t("login.title")
              : t("login.titre2")}
          </Text>
          <Text style={styles.subtitle}>
            {activeTab === "login"
              ? t("login.subtitle")
              : t("login.subtitle2")}
          </Text>

          {/* Login/Register Toggle Buttons */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, styles.leftTabButton]}
              onPress={() => setActiveTab("login")}
            >
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                colors={["#1B45B4", "#1C2792"]}
                style={[
                  styles.gradientTab,
                  { opacity: activeTab === "login" ? 1 : 0 },
                ]}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "login"
                    ? styles.activeTabText
                    : styles.inactiveTabText,
                ]}
              >
                {t("login.loginButton")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, styles.rightTabButton]}
              onPress={() => setActiveTab("register")}
            >
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                colors={["#1B45B4", "#1C2792"]}
                style={[
                  styles.gradientTab,
                  { opacity: activeTab === "register" ? 1 : 0 },
                ]}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "register"
                    ? styles.activeTabText
                    : styles.inactiveTabText,
                ]}
              >
                {t("login.registerButton")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Section */}
        <Formik
          initialValues={initialValues[activeTab]} // Set initial values based on active tab
          validationSchema={
            activeTab === "login"
              ? loginValidationSchema
              : registerValidationSchema
          }
          onSubmit={(values) => {
            if (activeTab === "login") {
              handleLogin(values, navigation);
            } else {
              handleRegister(values, navigation);
            }
          }}
          enableReinitialize // Reinitialize form when activeTab changes
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.formSection}>
              {/* name Field (only for Register) */}
              {activeTab === "register" && (
                <View style={styles.inputContainer}>
                  <Fontisto name="person" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t("login.name")}
                    value={values.name}
                    onChangeText={handleChange("name")}
                    onBlur={handleBlur("name")}
                    placeholderTextColor="#999"
                  />
                </View>
              )}
              {activeTab === "register" && touched.name && errors.name && (
                <Text style={styles.errorText}>{t(errors.name)}</Text>
              )}

              {/* Email Field */}
              <View style={styles.inputContainer}>
                <Fontisto name="email" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t("login.email")}
                  value={values.email}
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  placeholderTextColor="#999"
                />
              </View>
              {touched.email && errors.email && (
                <Text style={styles.errorText}>{t(errors.email)}</Text>
              )}

              {/* Password Field */}
              <View style={styles.inputContainer}>
                <AntDesign name="lock" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t("login.password")}
                  secureTextEntry={!passwordVisible}
                  value={values.password}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  style={styles.eyeIconContainer}
                >
                  <AntDesign name="eyeo" style={styles.eyeIcon} />
                </TouchableOpacity>
              </View>
              {touched.password && errors.password && (
                <Text style={styles.errorText}>{t(errors.password)}</Text>
              )}

              {/* Forgot Password Link */}
              {activeTab === "login" && (
                <TouchableOpacity 
                  style={styles.forgotContainer}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotText}>{t("login.forgotPassword")}</Text>
                </TouchableOpacity>
              )}

              {/* Confirm Password Field (only for Register) */}
              {activeTab === "register" && (
                <View style={styles.inputContainer}>
                  <AntDesign name="lock" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t("login.confirmPassword")}
                    secureTextEntry={!passwordVisible}
                    value={values.confirmPassword}
                    onChangeText={handleChange("confirmPassword")}
                    onBlur={handleBlur("confirmPassword")}
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setPasswordVisible(!passwordVisible)}
                    style={styles.eyeIconContainer}
                  >
                    <AntDesign name="eyeo" style={styles.eyeIcon} />
                  </TouchableOpacity>
                </View>
              )}
              {activeTab === "register" &&
                touched.confirmPassword &&
                errors.confirmPassword && (
                  <Text style={styles.errorText}>{t(errors.confirmPassword)}</Text>
                )}

              {/* Login Button */}
              {activeTab === "login" && (
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.loginButtonText}>{t("login.loginButton")}</Text>
                </TouchableOpacity>
              )}

              {/* Register Button */}
              {activeTab === "register" && (
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.loginButtonText}>{t("login.registerButton")}</Text>
                </TouchableOpacity>
              )}

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}></Text>
                <View style={styles.divider} />
              </View>

            

              {/* Registration Section */}
              <View style={styles.registerSection}>
                <Text style={styles.noAccountText}>
                  {activeTab === "login"
                    ? t("login.noAccount")
                    : t("login.haveAccount")}
                </Text>
                <TouchableOpacity
                  style={styles.registrationButton}
                  onPress={() =>
                    activeTab === "login"
                      ? setActiveTab("register")
                      : setActiveTab("login")
                  }
                >
                  <Text style={styles.registrationButtonText}>
                    {activeTab === "login" ? t("login.registerButton") : t("login.loginButton")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
  },

  // Header Section
  headerSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 25,
    marginTop: 20,
  },

  // Tab Container for Login/Register
  tabContainer: {
    flexDirection: "row",
    width: "100%",
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#EEF1FB",
    overflow: "hidden",
    marginVertical: 5,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  leftTabButton: {
    borderTopLeftRadius: 22.5,
    borderBottomLeftRadius: 22.5,
  },
  rightTabButton: {
    borderTopRightRadius: 22.5,
    borderBottomRightRadius: 22.5,
  },
  gradientTab: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22.5,
  },
  tabText: {
    fontWeight: "500",
    fontSize: 14,
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  inactiveTabText: {
    color: "#666",
  },

  // Form Section
  formSection: {
    width: "100%",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFF",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  inputIcon: {
    fontSize: 20,
    color: "#333",
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#333",
  },
  eyeIconContainer: {
    padding: 5,
  },
  eyeIcon: {
    fontSize: 20,
    color: "#333",
    marginRight: 10,
  },
  forgotContainer: {
    alignSelf: "flex-end",
    paddingVertical: 5,
  },
  forgotText: {
    color: "#1B45B4",
    fontSize: 12,
  },

  // Login Button
  loginButton: {
    backgroundColor: "#1B45B4",
    width: "100%",
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 15,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },

  // Divider
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
    fontSize: 12,
  },

  // Social Login Button
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 45,
    borderWidth: 1,
    borderColor: "#3949AB",
    borderRadius: 22.5,
    marginBottom: 25,
  },
  socialIcon: {
    fontSize: 20,
    color: "#333",
    marginRight: 10,
  },
  socialButtonText: {
    color: "#666",
    fontSize: 14,
  },

  // Registration Section
  registerSection: {
    width: "100%",
    alignItems: "center",
  },
  noAccountText: {
    color: "#666",
    fontSize: 13,
  },
  registrationButton: {
    marginTop: 10,
  },
  registrationButtonText: {
    color: "#1B45B4",
    fontSize: 14,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 10,
  },
});

export default Login;