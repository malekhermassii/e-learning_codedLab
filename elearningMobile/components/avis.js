import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { getCourseById } from "../api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from "react-redux";
import { addAvis } from "../redux/slices/avisSlice";

// Custom Alert Component
const CustomAlert = ({ visible, title, message, onClose, type = "success" }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <View style={[styles.alertIconContainer, 
            { backgroundColor: type === "success" ? "#4CAF50" : "#F44336" }]}>
            <AntDesign 
              name={type === "success" ? "checkcircleo" : "closecircleo"} 
              size={30} 
              color="#fff" 
            />
          </View>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <TouchableOpacity style={styles.alertButton} onPress={onClose}>
            <Text style={styles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const Avis = ({ course, isEnrolled, isAuth }) => {
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const userRedux = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success"
  });

  // Charger les données de l'utilisateur
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error(t('avis.errorLoadingUser'), error);
      }
    };
    loadUser();
  }, []);

  // Charger les avis du cours
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const courseDetails = await getCourseById(course._id);
        if (courseDetails && courseDetails.feedback_id) {
          setFeedback(courseDetails.feedback_id);
          setLoading(false);
        }
        setLoading(false);
      } catch (error) {
        console.error(t('avis.errorFetchingCourseDetails'), error);
        setLoading(false);
      } 
    };
    if (course && course._id) {
      fetchCourseDetails();
    }
  }, [course]);

  // Afficher l'alerte
  const showAlert = (title, message, type = "success") => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type
    });
  };

  // Fermer l'alerte
  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  // Soumettre le commentaire et l'évaluation
  const handleSubmitReview = async () => {
    if (!isAuth || !isEnrolled) {
      showAlert(
        t('avis.error'),
        t('avis.mustLogin'),
        "error"
      );
      return;
    }
    if (!comment.trim() || rating === 0) {
      showAlert(
        t('avis.error'),
        t('avis.writeComment'),
        "error"
      );
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.post(
        `http://192.168.70.148:4000/feedback/${course?._id}`,
        {
          message: comment.trim(),
          rating: rating,
          apprenant_id: user?._id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      

      if (response.data && response.data.feedback) {
        const newFeedback = {
          ...response.data.feedback,
          apprenant_id: {
            ...user,
            _id: user?._id,
            userId: {
              name: userRedux?.name || user?.name || "Anonyme",
              image: userRedux?.image || user?.image || null
            }
          }
        };
        setFeedback(prevFeedbacks => [...prevFeedbacks, newFeedback]);
        
        setComment("");
        setRating(0);
        showAlert(
          t('avis.success'),
          t('avis.reviewAdded'),
          "success"
        );
      }
    } catch (error) {
      console.error('Error adding review:', error);
      showAlert(
        t('avis.error'),
        t('avis.reviewError'),
        "error"
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3949AB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('avis.courseReviews')}</Text>
      {feedback && feedback.length > 0 ? (
        feedback.map((item, index) => (
          <View key={`${item.id}-${index}`} style={styles.reviewContainer}>
            <Image
              source={
                item?.apprenant_id?.userId?.image
                  ? { uri: `http://192.168.70.148:4000/Public/images/${item?.apprenant_id?.userId?.image}` }
                  : require("../assets/prof.png")
              }
              style={styles.avatar}
            />
            <View style={styles.textContainer}>
              <Text style={styles.name}>
                {item?.apprenant_id?.userId?.name 
                  || item?.apprenant_id?.name 
                  || t('avis.anonymous')}
              </Text>
              <Text style={styles.reviewText}>{item.message}</Text>
              <View style={styles.ratingContainer}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < item.rating ? "star" : "star-outline"}
                    size={16}
                    color="#FFD700"
                  />
                ))}
              </View>
              <Text style={styles.date}>
                {item.dateEnvoi ? new Date(item.dateEnvoi).toLocaleDateString() : t('avis.unknownDate')}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>{t('avis.noReviews')}</Text>
      )}

      <View style={styles.separator} />
      <Text style={styles.title}>{t('avis.giveReview')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('avis.commentPlaceholder')}
        multiline
        value={comment}
        onChangeText={setComment}
        maxLength={250}
      />
      <Text style={styles.charCount}>
        {250 - comment.length} {t('avis.charactersLeft')}
      </Text>
      <View style={styles.ratingContainer}>
        {[...Array(5)].map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setRating(i + 1)}>
            <Ionicons
              name={i < rating ? "star" : "star-outline"}
              size={24}
              color="#FFD700"
              style={styles.starIcon}
            />
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.sendButton} onPress={handleSubmitReview}>
        <Text style={styles.sendText}>{t('avis.send')}</Text>
        <Ionicons name="arrow-forward-circle" size={24} color="white" />
      </TouchableOpacity>

      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F8FC",
    padding: 20,
    marginBottom:-70,
    
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#202244",
    marginBottom: 10,
  },
  reviewContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#202244",
  },
  reviewText: {
    fontSize: 13,
    color: "#545454",
    marginTop: 2,
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  date: {
    fontSize: 12,
    color: "#A0A4AB",
    marginTop: 5,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  charCount: {
    fontSize: 12,
    color: "#A0A4AB",
    textAlign: "right",
    marginVertical: 5,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3949AB",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  sendText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 5,
  },
  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
  starIcon: {
    marginHorizontal: 2,
  },
  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  alertIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  alertMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666'
  },
  alertButton: {
    backgroundColor: '#3949AB',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default Avis;
