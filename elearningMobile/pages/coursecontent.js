import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Animated,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import Curriculum from "../components/curriculum";
import { Video } from "expo-video"; // Remplacez react-native-video par expo-av
import Overview from "../components/overview";
import Question from "../components/question";
import Avis from "../components/avis";
import { getCourseById, enrollInCourse } from "../api";
import { setCourses } from "../redux/slices/courseSlice";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from 'react-i18next';
import { hasActiveSubscriptionServer, isAuthenticated } from "../utils/auth";
import axios from "axios";

const Coursecontent = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { courseId } = route.params;
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Curriculum");
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const course = useSelector((state) =>
    state.courses.courses.find((c) => c._id === courseId)
  );
  const { t , i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  

  // Auto-save to localStorage
  useEffect(() => {
    const checkAuth = async () => {
      setIsAuth(await isAuthenticated());
    };
    checkAuth();
  }, []);
  useEffect(() => {
    if (course) {
      AsyncStorage.setItem("courses", JSON.stringify([course]));
    }
  }, [course]);

  //fetch course BY ID
  useEffect(() => {
    if (!course) {
      const loadInitialData = async () => {
        try {
          const response = await getCourseById(courseId);
          if (response) {
            dispatch(setCourses([response])); // ajoute le cours au store Redux
          }
        } catch (err) {
          setError(t('courseContent.errorLoadingCourse'));
        } finally {
          setLoading(false);
        }
      };
      loadInitialData();
    } else {
      setLoading(false);
    }
  }, [courseId, course, dispatch]);

  // Vérifier si l'utilisateur est déjà inscrit
  useEffect(() => {
    const checkEnrollment = async () => {
      try {
        const response = await fetch(`http://192.168.70.148:4000/enroll/check/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`
          }
        });
        const data = await response.json();
        setIsEnrolled(data.isEnrolled);
      } catch (error) {
        console.error(t('courseContent.errorVerifyingRegistration'), error);
      }
    };

    if (courseId) {
      checkEnrollment();
    }
  }, [courseId]);

  // refresh MODELE
  const refreshModel = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.post(`http://192.168.70.148:5000/refresh`,{
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // handleEnroll
  const handleEnroll = async () => {
    // 3. Si tout est OK, procéder à l'inscription
    try {
      const connected = await isAuthenticated();
      if (!connected) {
        navigation.navigate("Login"); // ou navigation.navigate("LoginPage")
        return;
      }
      // 2. Vérifier l'abonnement
      const abonnementActif = await hasActiveSubscriptionServer();
      if (!abonnementActif) {
        navigation.navigate("Subscribe"); // ou navigation.navigate("SubscribePage")
        return;
      }
      setIsEnrolling(true);
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(`http://192.168.70.148:4000/enroll/${courseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setIsEnrolled(true);
        Alert.alert(t('courseContent.success'), t('courseContent.youAreNowEnrolledInTheCourse'));
        refreshModel();
      } else {
        Alert.alert("Error", data.message || t('courseContent.errorDuringEnrollment'));
      }
    } catch (error) {
      Alert.alert(t('courseContent.error'), t('courseContent.errorDuringEnrollment'));
    } finally {
      setIsEnrolling(false);
    }
  };

  //tab animation
  const changeTab = (tab) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setActiveTab(tab);
  };

  // Remplace le tableau des tabs par des clés
  const tabKeys = ["Curriculum", "Overview", "QnA", "Review"];

  const renderContent = () => {
    switch (activeTab) {
      case "Curriculum":
        return (
          <View style={styles.tabContent}>
            <Curriculum course={course} isEnrolled={isEnrolled} isAuth={isAuth} />
          </View>
        );
      case "Overview":
        return (
          <View style={styles.tabContent}>
            <Overview course={course} />
          </View>
        );
      case "QnA":
        return (
          <View style={styles.tabContent}>
            <Question course={course} isEnrolled={isEnrolled} />
          </View>
        );
      case "Review":
        return (
          <View style={styles.tabContent}>
            <Avis course={course} isEnrolled={isEnrolled} isAuth={isAuth} />
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A36FF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Cours non trouvé</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
       <View style={styles.headerr}>
        <View style={styles.backButton}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <ImageBackground
          source={
            course.image ? { uri: `http://192.168.70.148:4000/Public/Images/${course.image}` } : require("../assets/prof.png")
          }
          style={styles.videoContainer}
          resizeMode="cover"
        >
          <TouchableOpacity
              style={styles.playButton}
              onPress={() => {}}
            >
              <Ionicons name="play" size={40} color="#fff" />
            </TouchableOpacity>
        </ImageBackground>

        <View style={styles.courseCard}>
          <View>
            <Text style={styles.courseTitle}>{currentLanguage === 'ar' ? course?.nom_ar : course?.nom}</Text>
            <Text style={styles.cardcat}>
              {currentLanguage === 'ar' ? course?.categorieId?.titre_ar : course?.categorieId?.titre}
            </Text>

            <Text style={styles.coursedesc}>{currentLanguage === 'ar' ? course?.description_ar : course?.description}</Text>
          </View>

          <View style={styles.Viewbtn}>
            <View style={styles.durationContainer}>
              <Icon
                name="play-circle-outline"
                size={18}
                color="#777"
                style={styles.infoicon}
              />
              <Text style={styles.durationText}>
                {course?.modules?.length || 0} {t('courseContent.modules')}
              </Text>
            </View>
            <LinearGradient
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              colors={["#6A36FF", "#AC5FE6"]}
              style={styles.subscribeButton}
            >
              <TouchableOpacity
                style={styles.subscribeButtonInner}
                
                onPress={isEnrolled ? () => {
                } : handleEnroll}
                disabled={isEnrolling}
              >
                { isEnrolling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.subscribeText}>
                    {isAuth && isEnrolled ? t('courseContent.learning') : t('courseContent.enroll')}
                  </Text>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Section des onglets améliorée */}
          <View style={styles.tabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScrollContainer}
            >
              {tabKeys.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => changeTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab && styles.tabTextActive,
                    ]}
                  >
                    {t(`courseContent.tabs.${tab}`)}
                  </Text>
                  {activeTab === tab && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <Animated.View
            style={[styles.contentContainer, { opacity: fadeAnim }]}
          >
            {renderContent()}
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    height: 50,
    justifyContent: "center",
    paddingHorizontal: 15,
    backgroundColor: "#1A1A1A",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  videoContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 70,
    height: 70,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  courseCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    paddingBottom: 120,
  },
  cardcat: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF991F",
    marginBottom: 10,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#14348A",
    marginBottom: 10,
  },
  coursedesc: {
    fontSize: 14,
    color: "#68718B",
    marginBottom: 20,
    lineHeight: 20,
  },
  Viewbtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  durationText: {
    marginLeft:0,
    color: "#666",
    fontSize: 14,
  },
  subscribeButton: {
    width: 100, // Ajustez la largeur selon vos besoins
    height: 33,
    borderRadius: 5,
    marginTop: 10, // Ajustez la marge selon vos besoins
  },
  subscribeButtonInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerr: {
    padding: 16,
    backgroundColor: "rgb(255, 255, 255)",
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

  separator: {
    width: 320,
    height: 1,
    borderColor: "#A0A4AB",
    marginTop: 12,
    borderWidth: 0.5,
  },
  subscribeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  // Nouveaux styles pour les onglets améliorés
  tabsContainer: {
    marginBottom: 15,
  },
  tabsScrollContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  tab: {
    marginRight: 30,
    paddingVertical: 12,
    position: "relative",
  },
  tabActive: {
    borderBottomColor: "#3366FF",
  },
  tabText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "400",
  },
  tabTextActive: {
    color: "#3366FF",
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: -5,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#3366FF",
    borderRadius: 3,
  },
  contentContainer: {
    marginTop: 10,
    paddingBottom: 20,
  },
  tabContent: {
    marginTop: 5,
    bottom: 9,
    minHeight: 300,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  contentText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  quizButton: {
    backgroundColor: "#3949AB",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  quizButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
  mainScrollView: {
    flex: 1,
  },
  infoicon: {
    marginRight: 8,
  },
});

export default Coursecontent;
