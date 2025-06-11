import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import Fontisto from "@expo/vector-icons/Fontisto";
import { useTranslation } from 'react-i18next';
const ResetPassword = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { email, code } = route.params;
  const [password, setPassword] = useState('');
  // handle reset
  const handleReset = async () => {
    try {
      await axios.post('http://192.168.70.148:4000/reset-password', { email, code, newPassword: password });
      Alert.alert(t("resetPassword.success"), t("resetPassword.passwordResetSuccess"), [
        { text: t("resetPassword.ok"), onPress: () => navigation.navigate('Login') }
      ]);
    } catch (e) {
      Alert.alert(t("resetPassword.error"), t("resetPassword.passwordResetError"));
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>{t("resetPassword.title")}</Text>
        <Text style={styles.subtitle}>{t("resetPassword.subtitle")}</Text>

        <View style={styles.inputContainer}>
          <Fontisto name="locked" style={styles.inputIcon} />
          <TextInput 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            style={styles.input}
            placeholder={t("resetPassword.placeholders.password")}
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity onPress={handleReset} style={styles.button}>
          <Text style={styles.buttonText}>{t("resetPassword.resetPassword")}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{t("resetPassword.back")}</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    width: '100%',
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
  button: {
    backgroundColor: '#1B45B4',
    width: '100%',
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
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

export default ResetPassword;
