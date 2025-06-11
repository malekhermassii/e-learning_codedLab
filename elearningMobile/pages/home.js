import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons";
import Course from "../components/cours";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchCategories, fetchCourses, fetchProfessors } from "../api";
import { setCourses, setCategories } from "../redux/slices/courseSlice";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from 'react-i18next';


const Home = ({ navigation }) => {
  const { t , i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [professors, setProfessors] = useState([]);

  const dispatch = useDispatch();
  const courses = useSelector((state) => state.courses.courses);
  const categories = useSelector((state) => state.categories.categories);
  const user = useSelector((state) => state.auth.userInfo);

  // Logging pour déboguer la structure des cours
  useEffect(() => {
    if (courses.length > 0) {
    }
  }, [courses]);

  // fetch course et categorie
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [coursesData, categoriesData, professorsData] = await Promise.all([
        dispatch(fetchCourses()),
        dispatch(fetchCategories()),
        fetchProfessors()
      ]);
      setProfessors(professorsData);
    } catch (err) {
      setError(err.message);
      console.error(t('home.errorLoadingData'), err);
      
      try {
        const [storedCourses, storedCategories, storedProfessors] = await Promise.all([
          AsyncStorage.getItem("courses"),
          AsyncStorage.getItem("categories"),
          AsyncStorage.getItem("professors")
        ]);
        
        if (storedCourses) dispatch(setCourses(JSON.parse(storedCourses)));
        if (storedCategories) dispatch(setCategories(JSON.parse(storedCategories)));
        if (storedProfessors) setProfessors(JSON.parse(storedProfessors));
      } catch (storageErr) {
        console.error(t('home.errorLoadingDataFromStorage'), storageErr);
      }
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // save course et categorie
  const saveData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem("courses", JSON.stringify(courses)),
        AsyncStorage.setItem("categories", JSON.stringify(categories))
      ]);
    } catch (err) {
      console.error(t('home.errorSavingData'), err);
    }
  }, [courses, categories]);

  useEffect(() => {
    saveData();
  }, [saveData]);

  const toggleMenu = useCallback(() => {
    navigation.openDrawer();
  }, [navigation]);

  // Filtrer les cours acceptés
  const acceptedCourses = courses.filter(course => course.statut === 'accepted');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView bounces={false} style={styles.scrollView}>
        {/* En-tête avec ImageBackground */}
        <ImageBackground
          source={require("../assets/header.png")}
          style={styles.headerBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <View style={styles.headerRow}>
              <Image source={require("../assets/logorg.png")} style={styles.logo} />
              <TouchableOpacity onPress={toggleMenu}>
                <AntDesign name="menu-fold" style={styles.menuIcon} />
              </TouchableOpacity>
            </View>
            <View style={styles.headerColumn}>
              <Text style={styles.titleText}>
                {t('home.title')}
              </Text>
              <Text style={styles.subtitleText}>
                {t('home.subtitle')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Subscribe")}>
              <LinearGradient
                colors={["#6A36FF", "#AC5FE6"]}
                style={styles.subscribeButton}
              >
                <Text style={styles.subscribeButtonText}>{t('home.subscribeButton')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Section blanche : "Explore Our Categories" */}
        <View style={styles.whiteSection}>
          <Text style={styles.sectionHeading}>{t('home.exploreCategories')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContainer}
          >
            <View style={styles.categoriesContainer}>
              {/* Category Cards */}

              {categories.map((category) => (
                <View key={category._id} style={styles.categoryCard}>
                  <Image
                    source={{
                      uri: category.image
                        ? `http://192.168.70.148:4000/Public/Images/${category.image}`
                        : "https://img.icons8.com/ios-filled/100/book.png",
                    }}
                    style={styles.categoryImage}
                  />

                  <Text style={styles.categoryLabel}>
                    {currentLanguage === 'ar' ? category.titre_ar : category.titre}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Section "Who e-learning?" */}
        <View style={styles.whiteSection}>
          <Text style={styles.sectionHeading}>{t('home.whoElearning')}</Text>
          <Text style={styles.sectionText}>{t('home.elearningDescription')}</Text>

          <View style={styles.column4}>
            <ImageBackground
              source={require("../assets/prof.png")}
              style={styles.imageBackground}
              resizeMode="cover"
            >
              <View style={styles.column5}>
                <Text style={styles.text10}>{t('home.forInstructors')}</Text>
                <TouchableOpacity
                  style={styles.transparentButton}
                  onPress={() => navigation.navigate("Demande")}
                >
                  <Text style={styles.text11}>{t('home.startClass')}</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
            <ImageBackground
              source={require("../assets/apprenant.png")}
              style={styles.imageBackground}
              resizeMode="cover"
            >
              <View style={styles.column5}>
                <Text style={styles.text10}>{t('home.forStudents')}</Text>
                <TouchableOpacity
                  style={styles.button3}
                  onPress={() => navigation.navigate("Subscribe")}
                >
                  <Text
                    style={styles.text11}
                    onPress={() => navigation.navigate("Subscribe")}
                  >
                    {t('home.startNow')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </View>
        </View>

        
        {/* Section Professeurs */}
        <View style={styles.whiteSection}>
          <Text style={styles.sectionHeading}>{t('home.ourInstructors')}</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : professors.length === 0 ? (
            <Text style={styles.emptyText}>{t('home.noTeachers')}</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.teachersContainer}
            >
              {professors.map((professor) => (
                <View key={professor._id} style={styles.teacherCard}>
                  <Image
                    source={
                      typeof professor.image === 'string' && professor.image.trim() !== ''
                        ? { uri: `http://192.168.70.148:4000/Public/Images/${professor.image}` }
                        : require("../assets/prof.png")
                    }
                    style={styles.teacherImage}
                  />
                  <Text style={styles.teacherName}>{professor.name}</Text>
                  <Text style={styles.teacherSpeciality}>{professor.specialite}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Popular Courses */}
        <View style={styles.whiteSection}>
          <TouchableOpacity onPress={() => navigation.navigate("Courses")}>
            <Text style={styles.sectionHeading}>{t('home.popularCourses')}</Text>
          </TouchableOpacity>
          
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : acceptedCourses.length === 0 ? (
            <Text style={styles.emptyText}>{t('home.noCourses')}</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.coursesContainer}>
              {acceptedCourses.slice(0, 4).map((course) => (
                <Course 
                  key={course._id} 
                  course={course} 
                />
              ))}
            </ScrollView>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  
  },
  scrollView: {
    flex: 1,
    marginBottom:70,
  },
  headerBackground: {
    width: "100%",
    height: 400,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(1, 1, 1, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 60,
    width: "100%",
    height: 400,
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
  },
  headerColumn: {
    alignItems: "center",
    marginBottom: 20,
  },
  titleText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitleText: {
    color: "#E6E8EC",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  subscribeButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  subscribeButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  menuIcon: {
    fontSize: 20,
    color: "#FFF",
  },
  whiteSection: {
    backgroundColor: "#FFF",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  horizontalScrollContainer: {
    paddingHorizontal: 10, // Espacement horizontal pour le défilement
  },
  categoriesContainer: {
    flexDirection: "row",
    marginHorizontal: 10,
  },
  categoryCard: {
    backgroundColor: "#ffff",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
    elevation: 5,
    width: 90,
    height: 70,
  },
  categoryImage: {
    marrginTop: 15,
    alignItems: "center",
    width: 27,
    height: 27,
    marginBottom: 10,
  },
  categoryLabel: {
    color: "#14348A",
    fontSize: 10,
    fontWeight: 400,
    textAlign: "center",
    fontFamily: "Mulish",
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#14348A",
    textAlign: "center",
    marginBottom: 40,
  },
  sectionText: {
    color: "#68718B",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  column4: {
    marginBottom: 30,
    marginHorizontal: 20,
  },
  column5: {
    alignItems: "center",
    backgroundColor: "#171B4080",
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 20,
  },
  text10: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: 400,
    marginBottom: 15,
  },
  text11: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "200",
  },
  button3: {
    backgroundColor: "#0097FE",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  imageBackground: {
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 20,
  },
  transparentButton: {
    backgroundColor: "transparent",
    borderRadius: 25,
    borderWidth: 0.6,
    borderColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  emptyText: {
    color: "#68718B",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  coursesContainer: {
    paddingHorizontal: 10,
  },
  teachersContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  teacherCard: {
    width: 160,
    marginRight: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  teacherImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  teacherSpeciality: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default Home;
