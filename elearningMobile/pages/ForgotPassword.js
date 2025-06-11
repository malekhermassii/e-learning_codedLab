import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Fontisto from "@expo/vector-icons/Fontisto";

const ForgotPassword = ({ navigation }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email(t("validation.invalidEmail"))
      .required(t("validation.emailRequired")),
  });

  // Gérer la soumission du formulaire
  const handleSubmit = async (values) => {
    try {
      setIsLoading(true);
      const response = await axios.post('http://192.168.70.148:4000/forgot-password', {
        email: values.email,
      });
      if (response.status === 200) {
        Alert.alert(
          t("forgotPassword.success"),
        t("forgotPassword.resetPasswordEmailSent"),
        [
          {
            text: "OK",
            onPress: () => navigation.navigate('VerifyCode', { email: values.email }),
          },
        ]
          );
      }
    } catch (error) {
      Alert.alert(
        t("forgotPassword.alerts.error"),
        error.response?.data?.message || t("forgotPassword.alerts.genericError")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>{t("forgotPassword.title")}</Text>
        <Text style={styles.subtitle}>{t("forgotPassword.subtitle")}</Text>

        <Formik
          initialValues={{ email: '' }}
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
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Fontisto name="email" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t("login.email")}
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {touched.email && errors.email && (
                <Text style={styles.errorText}>{t(errors.email)}</Text>
              )}

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {t("forgotPassword.submit")}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>{t("forgotPassword.back")}</Text>
              </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
    paddingTop: 200,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  inputIcon: {
    fontSize: 20,
    color: '#333',
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: '#1B45B4',
    width: '100%',
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  backButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#1B45B4',
    fontSize: 16,
  },
});

export default ForgotPassword; 