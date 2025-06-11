import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import Etatcourse from "../components/etatcours";
import { useTranslation } from 'react-i18next';
import { fetchAllProgress } from "../api";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
export default function Coursprogress() {
  const [searchQuery, setSearchQuery] = useState("");
  const { t , i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [completedProgress, setCompletedProgress] = useState([]);
  const [ongoingProgress, setOngoingProgress] = useState([]);
  const [activeTab, setActiveTab] = useState("Completed"); // Onglet actif
  const navigation = useNavigation();
  
  // load progress
  useEffect(() => {
    const loadProgress = async () => {
      const { completed, ongoing } = await fetchAllProgress();
      setCompletedProgress(completed);
      setOngoingProgress(ongoing);
    };
    loadProgress();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
       <View style={styles.header}>
        <View style={styles.backButton}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.scrollView}>
        <View style={styles.column}>
          {/* Barre de recherche */}
          <View style={styles.searchBar}>
            <TextInput
              placeholder={t('progressionCours.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.input}
            />
            <AntDesign name="search1" size={24} color="#1B45B4" />
          </View>
        </View>

        {/* Onglets custom */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "Completed" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("Completed")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Completed" && styles.tabTextActive,
              ]}
            >
              {t('progressionCours.completed') || "Completed"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "Ongoing" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("Ongoing")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Ongoing" && styles.tabTextActive,
              ]}
            >
              {t('progressionCours.ongoing') || "Ongoing"}
            </Text>
          </TouchableOpacity>
        </View>


        {/* Contenu selon l'onglet actif */}
        <ScrollView style={{ flex: 1 }}>
          {activeTab === "Completed" ? (
            completedProgress.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text>{t('etatCours.noData')}</Text>
              </View>
            ) : (
              completedProgress.map((progress, idx) => (
                <Etatcourse
                  key={progress._id || idx}
                  type="completed"
                  searchQuery={searchQuery}
                  course={progress.courseId }
                  progress={progress}

                />
              ))
            )
          ) : (
            ongoingProgress.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text>{t('etatCours.noData')}</Text>
              </View>
            ) : (
              ongoingProgress.map((progress, idx) => (
                <Etatcourse
                  key={progress._id || idx}

                  type="ongoing"
                  searchQuery={searchQuery}
                  course={progress.courseId}
                  progress={progress}
                />
              ))
            )
          )}
        </ScrollView>
      </View>
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
    marginBottom: 70,
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
    paddingTop:20
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    color: "#333",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    marginTop:7

  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    backgroundColor: "#F4F8FE",
    paddingBottom: 21,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingVertical: 10,
    paddingLeft: 20,
    paddingRight: 10,
    marginBottom: 26,
    marginTop: 29,
    marginHorizontal: 31,
    shadowColor: "#0000001A",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 12,
    elevation: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 6,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 0,
    marginTop: 0,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#F4F8FE",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: "#007bff",
    backgroundColor: "#fff",
  },
  tabText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 16,
  },
  tabTextActive: {
    color: "#007bff",
  },
});
