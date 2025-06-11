import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { Video } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import { getCourseById } from "../api";
import { useTranslation } from 'react-i18next';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Progress from 'react-native-progress';
import { hasActiveSubscriptionServer } from "../utils/auth";  
const { width, height } = Dimensions.get("window");
import axios from "axios";

const Curriculum = ({ course, isEnrolled, isAuth }) => {

  const navigation = useNavigation();
  const [expandedModules, setExpandedModules] = useState({});
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progression, setProgression] = useState(null);
  const [isQuizDone, setIsQuizDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);

  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  //fetch course details
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setIsLoading(true);
        const courseDetails = await getCourseById(course._id);
        if (courseDetails && courseDetails.modules) {
          setModules(courseDetails.modules);
          setIsLoading(false);
        }
        // Charger les leçons complétées depuis AsyncStorage
        const savedProgress = await AsyncStorage.getItem(`course_${course._id}_progress`);
        if (savedProgress) {
          setCompletedLessons(JSON.parse(savedProgress));
        }
      } catch (error) {
        console.error(t('curriculum.errorFetchingCourseDetails'), error);
        setIsLoading(false);
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    if (course && course._id) {
      fetchCourseDetails();
    }
  }, [course]);

  // check quiz status
  const checkQuizStatusFromAPI = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(
        `http://192.168.70.148:4000/quizResult/${course.quizId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      if (!response.ok) {
        setIsQuizDone(false);
        return;
      }
      const data = await response.json();
      // On considère que le quiz est réussi si le score est suffisant
      setIsQuizDone(data.score >= 17);
    } catch (error) {
      console.error(t('curriculum.errorFetchingQuizResult'), error);
      setIsQuizDone(false);
    }
  };

  // Appelle cette fonction dans un useEffect
  useEffect(() => {
    if (course && course.quizId && isEnrolled && progression && progression.progressionCours >= 100) {
      checkQuizStatusFromAPI();
    }
  }, [course, isEnrolled, progression]);

  // toggle module
  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  //handle video press
  const handleVideoPress = async (video) => {
    const hasActiveSubscription = await hasActiveSubscriptionServer();
    if (!hasActiveSubscription) {
      Alert.alert(
        t('curriculum.restrictedAccess'),
        t('curriculum.restrictedAccessMessage'),
        [{ text: t('curriculum.ok') }]
      );
      navigation.navigate("Subscribe");
      return;
    }

    const module = modules.find(m => m.videos.some(v => v._id === video._id));
    const moduleIndex = modules.findIndex(m => m._id === module._id);
    const videoIndex = module.videos.findIndex(v => v._id === video._id);

    // Vérifier si c'est le premier module et la première vidéo
    if (moduleIndex === 0 && videoIndex === 0) {
      try {
        await initUserProgress(course._id, module._id, video._id);
        setSelectedVideo(video);
        setIsModalVisible(true);
      } catch (error) {
        console.error("Error initializing progress:", error);
      }
      return;
    }

    // Vérifier si c'est un module ou une vidéo précédente
    if (moduleIndex < activeModule || (moduleIndex === activeModule && videoIndex < activeLesson)) {
      try {
        await initUserProgress(course._id, module._id, video._id);
        setSelectedVideo(video);
        setIsModalVisible(true);
      } catch (error) {
        console.error("Error initializing progress:", error);
      }
      return;
    }

    // Pour les modules et vidéos suivants, vérifier si tous les précédents sont terminés
    let allPreviousCompleted = true;

    // Vérifier les modules précédents
    for (let i = 0; i < moduleIndex; i++) {
      const prevModule = modules[i];
      for (const prevVideo of prevModule.videos) {
        if (!completedLessons.includes(prevVideo._id)) {
          allPreviousCompleted = false;
          break;
        }
      }
      if (!allPreviousCompleted) break;
    }

    // Vérifier les vidéos précédentes dans le module actuel
    if (allPreviousCompleted && moduleIndex === activeModule) {
      for (let i = activeLesson; i < videoIndex; i++) {
        const prevVideo = module.videos[i];
        if (!completedLessons.includes(prevVideo._id)) {
          allPreviousCompleted = false;
          break;
        }
      }
    }

    if (!allPreviousCompleted) {
      Alert.alert(
        t('curriculum.completePreviousLessons'),
        t('curriculum.completePreviousLessonsMessage'),
        [{ text: t('curriculum.ok') }]
      );
      return;
    }

    try {
      await initUserProgress(course._id, module._id, video._id);
      setSelectedVideo(video);
      setIsModalVisible(true);
    } catch (error) {
      console.error("Error initializing progress:", error);
    }
  };

  //close modal
  const closeModal = async () => {
    if (selectedVideo) {
      const module = modules.find(m => m.videos.some(v => v._id === selectedVideo._id));
      if (module) {
        try {
          await updateUserProgress(course._id, module._id, selectedVideo._id);
          // Ajouter la vidéo aux leçons complétées
          const newCompletedLessons = [...completedLessons, selectedVideo._id];
          setCompletedLessons(newCompletedLessons);
          // Sauvegarder la progression dans AsyncStorage
          await AsyncStorage.setItem(`course_${course._id}_progress`, JSON.stringify(newCompletedLessons));
          // Mettre à jour les indices actifs
          const moduleIndex = modules.findIndex(m => m._id === module._id);
          const videoIndex = module.videos.findIndex(v => v._id === selectedVideo._id);
          setActiveModule(moduleIndex);
          setActiveLesson(videoIndex);
          // Mettre à jour la progression
          await fetchUserProgress();
        } catch (error) {
          console.error(t('curriculum.errorUpdatingProgress'), error);
        }
      }
    }
    setIsModalVisible(false);
    setSelectedVideo(null);
  };

  //handle quiz button press
  const handleQuizButtonPress = () => {
    if (course?.quizId) {
      navigation.navigate("Quiz", {
        courseId: course._id,
        quizId: course.quizId,
        courseName: currentLanguage === 'ar' ? course.nom_ar : course.nom
      });
    } else {
      Alert.alert(
        t('curriculum.quizNotAvailable'),
        t('curriculum.quizNotAvailableMessage'),
        [{ text: t('curriculum.ok') }]
      );
    }
  };

  //handle user progress
  const initUserProgress = async (courseId, moduleId, videoId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      await fetch(
        `http://192.168.70.148:4000/progress/create/${courseId}/${moduleId}/${videoId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error(t('curriculum.errorInitializingProgress'), error);
    }
  };

  //update user progress
  const updateUserProgress = async (courseId, moduleId, videoId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(
        `http://192.168.70.148:4000/progress/update/${courseId}/${moduleId}/${videoId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return await response.json();
    } catch (error) {
      console.error(t('curriculum.errorUpdatingProgress'), error);
    }
  };

  //fetch user progress
  const fetchUserProgress = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(
        `http://192.168.70.148:4000/courseprogress/${course._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      const data = await response.json();
      if (response.ok && data && data.length > 0) {
        setProgression(data[0]);
      }
    } catch (error) {
      console.error(t('curriculum.errorLoadingProgress'), error);
    }
  };

  //handle certificate button press
  const handleCertificateButtonPress = async () => {
    const token = await AsyncStorage.getItem("userToken");
    const quizResultsStr = await axios.get(`http://192.168.70.148:4000/quizResult/${course.quizId}`,{
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (quizResultsStr) {
      const quizResults = quizResultsStr.data;  
      navigation.navigate("Certificate", {
        score: quizResults.score,
        courseId: course._id
      })
    }
  }

  //fetch user progress
  useEffect(() => {
    if (course && course._id && isEnrolled) {
      fetchUserProgress();
    }
  }, [course, isEnrolled]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3949AB" />
      </View>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>{t('curriculum.noModules')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isAuth && isEnrolled && (<>
        <Text style={styles.title}>{t('curriculum.progress')}</Text>
        <View style={{ alignItems: 'center', marginVertical: 7, marginTop: -8, marginBottom: 30 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
            {progression ? progression.progressionCours : 0}%
          </Text>
          <Progress.Bar
            progress={(progression ? progression.progressionCours : 0) / 100}
            width={250}
            height={12}
            color="#3949AB"
            unfilledColor="#e0e0e0"
            borderRadius={8}
            borderWidth={0}
            animated={true}
          />
        </View></>

      )}
      <Text style={styles.title}>{t('curriculum.courseContent')}</Text>

      {modules.map((module, index) => (
        <View key={module._id || index}>
          <TouchableOpacity
            style={styles.moduleHeader}
            onPress={() => toggleModule(module._id)}
          >
            <View style={styles.moduleInfo}>
              <Text style={styles.moduleTitle}>{currentLanguage === 'ar' ? module.titre_ar : module.titre}</Text>
              <Text style={styles.moduleDuration}>
                {module.videos?.length || 0} {t('curriculum.videos')}
              </Text>
            </View>
            <AntDesign
              name={expandedModules[module._id] ? "up" : "down"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>

          {expandedModules[module._id] && (
            <View style={styles.videosContainer}>
              {module.videos?.map((video, vIndex) => (
                <TouchableOpacity
                  key={video._id || vIndex}
                  style={styles.videoItem}
                  onPress={() => handleVideoPress(video)}
                >
                  <AntDesign name="playcircleo" size={20} color="#3f51b5" />
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle}>{currentLanguage === 'ar' ? video.titrevd_ar : video.titrevd || t('curriculum.noVideoTitle')}</Text>
                    <Text style={styles.videoDuration}>
                      {video.duree || "00:00"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}
      {isAuth && isEnrolled && progression && progression.progressionCours >= 100 && !isQuizDone ?
        <View style={styles.quizButtonContainer}>
          <TouchableOpacity
            style={styles.quizButton}
            onPress={handleQuizButtonPress}
          >
            <Text style={styles.quizButtonText}>
              {course?.quizId ? t('curriculum.startQuiz')

                : t('curriculum.quizNotAvailable')}
            </Text>
          </TouchableOpacity>
        </View>
        : isAuth && isEnrolled && progression && progression.progressionCours >= 100 && isQuizDone ?
          <View style={styles.quizButtonContainer}>
            <TouchableOpacity
              style={styles.quizButton}
              onPress={handleCertificateButtonPress}
            >
              <Text style={styles.quizButtonText}>
                {t('curriculum.viewCertificate')

                }
              </Text>
            </TouchableOpacity>
          </View>
          : null
      }
      {/* Modal pour afficher le contenu de la vidéo */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedVideo?.url ? (
              <Video
                source={{ uri: `http://192.168.70.148:4000/Public/Videos/${selectedVideo.url}` }}
                useNativeControls
                resizeMode="contain"
                style={{ width: "100%", height: "100%" }}
                onPlaybackStatusUpdate={async (status) => {
                  if (status.didJustFinish) {
                    await updateUserProgress(
                      course._id,
                      modules.find(m => m.videos.some(v => v._id === selectedVideo._id))._id,
                      selectedVideo._id
                    );
                    await fetchUserProgress();
                  }
                }}
              />
            ) : (
              <Text style={styles.noVideoText}>
                {t('curriculum.noVideoSource')}
              </Text>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
    minHeight: '100%',
    height: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 20,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  moduleDuration: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  videosContainer: {
    marginLeft: 16,
    marginBottom: 16,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3949AB',
  },
  videoInfo: {
    marginLeft: 12,
    flex: 1,
  },
  videoTitle: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 2,
  },
  videoDuration: {
    fontSize: 12,
    color: '#95a5a6',
  },
  quizButtonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  quizButton: {
    backgroundColor: '#3949AB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quizButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 20,
  },
  noVideoText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
    fontSize: 16,
  },
});

export default Curriculum;
