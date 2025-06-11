import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Importer le LinearGradient
import { useNavigation } from "@react-navigation/native"; // Pour la navigation
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const BottomMenu = () => {
  const [selected, setSelected] = useState(null); // État pour suivre le bouton sélectionné
  const navigation = useNavigation(); // Utiliser le hook pour la navigation
  const { t } = useTranslation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Fonction pour gérer la sélection du bouton
  const handlePress = (screen, index) => {
    setSelected(index);
    navigation.navigate("DrawerMenu", { screen: screen }); // Accéder à Home via DrawerMenu
  };

  return (
      isAuthenticated && (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      colors={["#6572EB26", "#6572EB00"]} // Définir les couleurs du gradient
      style={styles.container}
    >
      <View style={styles.menuItemsContainer}>
        {/* Item Menu 1: Home */}
        <TouchableOpacity
          style={[styles.menuItem, selected === 0 && styles.selectedItem]} // Ajouter le style sélectionné
          onPress={() => handlePress("Home", 0)} // Navigation vers l'écran Home
        >
          <AntDesign
            name="home"
            style={[styles.icon, selected === 0 && styles.selectedIcon]}
          />
          <Text style={[styles.text, selected === 0 && styles.selectedText]}>
            {t('bottomMenu.home')}
          </Text>
        </TouchableOpacity>

        {/* Item Menu 2: Cours */}
        <TouchableOpacity
          style={[styles.menuItem, selected === 1 && styles.selectedItem]} // Ajouter le style sélectionné
          onPress={() => navigation.navigate("My Courses")} // Navigation vers l'écran Cours
        >
          <Entypo
            name="open-book"
            style={[styles.icon, selected === 1 && styles.selectedIcon]}
          />
          <Text style={[styles.text, selected === 1 && styles.selectedText]}>
            {t('bottomMenu.myCourses')}
          </Text>
        </TouchableOpacity>

        {/* Item Menu 3: Profile */}
        <TouchableOpacity
          style={[styles.menuItem, selected === 2 && styles.selectedItem]} // Ajouter le style sélectionné
          onPress={() => handlePress("Profile", 2)} // Navigation vers l'écran Profile
        >
          <AntDesign
            name="user"
            style={[styles.icon, selected === 2 && styles.selectedIcon]}
          />
          <Text style={[styles.text, selected === 2 && styles.selectedText]}>
            {t('bottomMenu.profile')}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  ) )
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row", // Disposer les éléments en ligne
    justifyContent: "space-around", // Espacer également les éléments
    alignItems: "center",
    padding: 10,
    position: "absolute", // Fixer le menu en bas de l'écran
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
     // Le fond est transparent, mais un gradient est appliqué
  },
  menuItemsContainer: {
    flexDirection: "row", // Disposer les éléments horizontalement
    justifyContent: "space-around",
    width: "100%",
    height: 40, // Augmenter la hauteur du menu
  },
  menuItem: {
    alignItems: "center",
    height: 70, // Augmenter la hauteur des éléments du menu
    justifyContent: "center",
    paddingBottom:37, // Centrer les éléments (icône et texte)
  },
  icon: {
    fontSize: 18, // Taille des icônes
    color: "#000", // Couleur de l'icône par défaut
  },
  text: {
    color: "#000", // Couleur du texte par défaut
    fontSize: 13, // Taille du texte
    marginTop: 5,
  },

  selectedIcon: {
    color: "#0961F5", // Couleur bleue pour l'icône sélectionnée
  },
  selectedText: {
    color: "#0961F5", // Couleur bleue pour le texte sélectionné
  },
});

export default BottomMenu;
