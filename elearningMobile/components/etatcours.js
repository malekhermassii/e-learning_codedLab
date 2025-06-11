import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet,Alert } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { hasActiveSubscriptionServer } from "../utils/auth";

const Etatcourse = ({ type, searchQuery, course, progress }) => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur a terminé quiz
  useEffect(() => {
    const checkQuizStatus = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('userToken');
        console.log('Token:', token ? 'Token exists' : 'No token found');
        if (!token) {
          setIsQuizCompleted(false);
          setQuizResults(null);
          return;
        }
        if (course?._id && course?.quizId) {
          console.log('Course ID:', course._id);
          console.log('Quiz ID:', course.quizId);
          const response = await axios.get(
            `http://192.168.70.148:4000/quizResult/${course.quizId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          if (response.data) {
            setQuizResults(response.data);
            setIsQuizCompleted(response.data.score >= 17);
          }
        } else {
     
          console.log('Course:', course);
        }
      } catch (error) {
        console.log(t('etatCours.errorCheckingQuizStatus'), error);

        setIsQuizCompleted(false);
        setQuizResults(null);
      } finally {
        setLoading(false);
      }
    };

    if (course?._id && course?.quizId) {
      checkQuizStatus();
    } else {
      setLoading(false);
    }
  }, [course?._id, course?.quizId]);

  if (!course) {
    return (
      <View style={styles.noDataContainer}>
      </View>
    );
  }

  const isCourseMatched = searchQuery && course.nom
    ? course.nom.toLowerCase().includes(searchQuery.toLowerCase())
    : true;

  if (!isCourseMatched) return null;
  // Gérer le clic sur le bouton pour continuer à apprendre
  const handleContinueLearning = async (course) => {
    const hasActiveSubscription = await hasActiveSubscriptionServer();
    if (hasActiveSubscription) {
      navigation.navigate("coursecontent", { courseId: course._id });
    } else {
      Alert.alert(
        t('etatCours.subscriptionExpired')
      );
      navigation.navigate("Subscribe");
    }

  };

  // Gérer le clic sur le bouton pour passer quiz
  const handleTakeQuiz = async (course) => {
    const hasActiveSubscription = await hasActiveSubscriptionServer();
    if (hasActiveSubscription) {
      navigation.navigate("Quiz", { courseId: course._id, quizId: course.quizId, courseName: currentLanguage === 'ar' ? course.nom_ar : course.nom });
    } else {
      Alert.alert(
        t('etatCours.subscriptionExpired')
      );
      navigation.navigate("Subscribe");
    }
  };

  // Afficher le cours terminé
  const CompletedCourse = () => (
    <>
      <View style={styles.buttonRatingContainer}>
        <Text style={styles.progress}>
          📊 {t('etatCours.progress')}: {progress?.progressionCours || 0}%
        </Text>
        <View style={styles.ratingContainer}>
          {/* <Icon name="star" size={14} color="#FFD700" /> */}
          <Text style={styles.ratingText}>{t('etatCours.score')} :  {quizResults?.score || 0}</Text>
        </View>
      </View>
      {progress?.complet && (
        isQuizCompleted ? (
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("Certificate", {
            certificatId: quizResults?.certificat?.id,
            score: quizResults?.score,
            courseId: course._id
          })}>
            <Text style={styles.viewCertificate}>{t('etatCours.viewCertificate')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btn} onPress={() => handleTakeQuiz(course)}>
            <Text style={styles.viewCertificate}>{t('etatCours.takeQuiz') || "Take Quiz"}</Text>
          </TouchableOpacity>
        )
      )}

    </>
  );
  // Afficher le cours en cours
  const OngoingCourse = () => (
    <>
    <View style={styles.buttonRatingContainer}>
      <Text style={styles.progress}>
        📊 {t('etatCours.progress')}: {progress?.progressionCours || 0}%
      </Text>
      <View style={styles.ratingContainer}>
        <Icon name="star" size={14} color="#FFD700" />
        <Text style={styles.ratingText}>{course.rating || 4.5}</Text>
      </View>


    </View>
     <TouchableOpacity style={styles.btn} onPress={() => handleContinueLearning(course)}>
      <Text style={styles.viewCertificate}>{t('etatCours.continuelearning')}</Text>
    </TouchableOpacity>
    </>
  );

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingContainer]}>
        <Text>{t('etatCours.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Image
        source={
          course.image
            ? { uri: `http://192.168.70.148:4000/Public/Images/${course.image}` }
            : require("../assets/prof.png")
        }
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {currentLanguage === 'ar' ? course.nom_ar : course.nom || t('etatCours.defaultCourseName')}
        </Text>
        <Text style={styles.cardcat} numberOfLines={1}>
          {currentLanguage === 'ar'
            ? course.categorieId?.titre_ar
            : course.categorieId?.titre || t('etatCours.defaultCategory')}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {currentLanguage === 'ar'
            ? course.description_ar
            : course.description || t('etatCours.defaultDescription')}
        </Text>

        {type === "completed" ? <CompletedCourse /> : <OngoingCourse />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "80%",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    overflow: "hidden",
    alignSelf: "center",
    marginTop: 20,
  },
  cardImage: {
    width: "100%",
    height: 150,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#14348A",
    marginBottom: 5,
  },
  cardcat: {
    fontSize: 12,
    fontWeight: "400",
    color: "#FF991F",
    marginBottom: 5,
  },
  cardDesc: {
    fontSize: 14,
    color: "#68718B",
    marginBottom: 10,
  },
  courseInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#777",
    marginLeft: 5,
  },
  infoicon: {
    marginRight: 3,
  },
  btn: {
    alignContent: "center",
    alignSelf: "center",
    marginTop: 10,
    backgroundColor: "#14348A",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  buttonRatingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewCertificate: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  progress: {
    fontSize: 14,
    color: "#FF991F",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#14348A",
    marginLeft: 5,
  },
});

export default Etatcourse;