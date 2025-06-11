import React, { useState } from 'react';
import { TouchableOpacity, Text, Alert, ScrollView, Image, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../pages/i18n/i18n'; // <-- Ajouté
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageSwitcher = ({ language, setLanguage }) => {
  const { t } = useTranslation();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const changeLanguage = async (newLang) => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
    await AsyncStorage.setItem('appLanguage', newLang);
    Alert.alert(t('drawer.languageChanged'), t('drawer.languageSwitchedTo', { lang: newLang }));
    setShowLanguageSelector(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowLanguageSelector(!showLanguageSelector)}
        style={styles.drawerItem}
      >
        <Ionicons name="language" size={20} color="#828282" />
        <Text style={styles.drawerItemText}>{t('drawer.language')}</Text>
        <Ionicons
          name={showLanguageSelector ? "chevron-up" : "chevron-down"}
          size={20}
          color="#828282"
          style={{ marginLeft: 30 }}
        />
      </TouchableOpacity>

      {showLanguageSelector && (
        <ScrollView style={styles.languageSelector}>
          <TouchableOpacity
            onPress={() => changeLanguage("en")}
            style={[
              styles.languageOption,
              language === "en" && styles.selectedLanguage
            ]}
          >
            <Image
              source={require("../assets/uk-circle-01.png")}
              style={styles.flagIcon}
            />
            <Text style={styles.languageText}>{t('drawer.english')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => changeLanguage("ar")}
            style={[
              styles.languageOption,
              language === "ar" && styles.selectedLanguage
            ]}
          >
            <Image
              source={require("../assets/emirats-arabes-unis.png")}
              style={styles.flagIcon}
            />
            <Text style={styles.languageText}>{t('drawer.arabic')}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  drawerItem: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#77777B',
  },
  languageSelector: {
    marginLeft: 15,
    marginRight: 15,
  },
  languageOption: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedLanguage: {
    backgroundColor: '#ddd',
  },
  flagIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  languageText: {
    fontSize: 14,
    color: '#000',
  },
});

export default LanguageSwitcher; 