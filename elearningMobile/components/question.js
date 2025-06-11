import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { getCourseById } from "../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { addQuestion } from "../redux/slices/questionSlice";
import { useTranslation } from 'react-i18next';
import { isAuthenticated } from "../utils/auth";

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

const Question = ({ course, isEnrolled }) => {
  const [question, setQuestion] = useState("");
  const [questions, setQuestions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState(""); // maintenant une chaîne
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const userRedux = useSelector((state) => state.auth.user);
  const [isAuth, setIsAuth] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success"
  });
  const [shouldRefetch, setShouldRefetch] = useState(false);

  //check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      setIsAuth(await isAuthenticated());
    };
    checkAuth();
  }, []);

  //fetch user data from local storage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error(
          t('question.errorLoadingUserData'),
          error
        );
      }
    };
    loadUser();
  }, []);

  //fetch course details
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {      
        setLoading(true);
        const courseDetails = await getCourseById(course._id);
        if (courseDetails && courseDetails.question_id) {
          setQuestions(courseDetails.question_id);
          setLoading(false);
        }
        setShouldRefetch(false);
        setLoading(false);
      } catch (error) {
        console.error(t('question.errorFetchingCourseDetails'), error);
        setLoading(false);
      }
    };
    if (course && course._id) {
      fetchCourseDetails();
    }
  }, [course, shouldRefetch]);

  //show alert
  const showAlert = (title, message, type = "success") => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type
    });
  };

  //hide alert
  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  //handle add question
  const handleAddQuestion = async () => {
    if (!isAuth || !isEnrolled) {
      showAlert(
        t('question.restrictedAccess'),
        t('question.mustSubscribe'),
        "error"
      );
      return;
    }
    if (!newQuestion.trim()) {
      showAlert(
        t('question.error'),
        t('question.emptyQuestion'),
        "error"
      );
      return;
    }
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.post(
        `http://192.168.70.148:4000/question/${course._id}`,
        { question: newQuestion },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
        }
      );
      if (response.status === 201) {
        const newQuestionFromAPI = {
          ...response.data.question,
          apprenant_id: {
            ...response.data.question.apprenant_id,
            userId: {
              name: userRedux?.name || user?.name || "Anonyme",
              image: userRedux?.image || user?.image || null
            }
          }
        };
        dispatch(addQuestion(newQuestionFromAPI));
        setQuestions([...questions, newQuestionFromAPI]);
        setNewQuestion("");
        setShouldRefetch(true);
        showAlert(
          t('question.success'),
          t('question.questionAdded'),
          "success"
        );
      }
    } catch (error) {
      console.error(t('question.errorAddingQuestion'), error);
      showAlert(
        t('question.error'),
        t('question.addError'),
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
      <Text style={styles.title}>{t('question.allQuestions')}</Text>      
      {questions.length > 0 ? (
        questions.map((item) => (
          <View key={item._id} style={styles.questionContainer}>
            <Image
              source={
                item?.apprenant_id?.userId?.image
                  ? {
                      uri: `http://192.168.70.148:4000/Public/Images/${item.apprenant_id?.userId.image}`,
                    }
                  : require("../assets/prof.png")
              }
              style={styles.avatar}
            />
            <View style={styles.textContainer}>
              <Text style={styles.name}>
                {item?.apprenant_id?.userId?.name || item?.apprenant_id?.name || t('avis.anonymous')}
              </Text>
              <Text style={styles.questionText}>{item.question}</Text>
              {item.reponse && (
                <View style={styles.reponseContainer}>
                  <Text style={styles.reponseLabel}>{t('question.answer')} {course?.professeurId?.name}</Text>
                  <Text style={styles.reponseText}>{item.reponse}</Text>
                </View>
              )}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>{t('question.noQuestions')}</Text>
      )}
      <View style={styles.separator} />
      { (
        <>
          <Text style={styles.title}>{t('question.askQuestion')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('question.questionPlaceholder')}
            multiline
            value={newQuestion}
            onChangeText={setNewQuestion}
          />
          <Text style={styles.charCount}>
            {250 - question.length} {t('avis.charactersLeft')}
          </Text>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleAddQuestion}
          >
            <Text style={styles.sendText}>{t('question.send')}</Text>
            <Ionicons name="arrow-forward-circle" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}
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
  container: {
    flex: 1,
    backgroundColor: "#F6F8FC",
    padding: 20,
    marginBottom: -50,
    
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#202244",
    marginBottom: 10,
  },
  questionContainer: {
    flexDirection: "row",
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
    marginBottom: 4,
  },
  questionText: {
    fontSize: 14,
    color: "#545454",
    marginBottom: 8,
  },
  reponseContainer: {
    backgroundColor: "#F0F2F5",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  reponseLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#202244",
    marginBottom: 4,
  },
  reponseText: {
    fontSize: 13,
    color: "#545454",
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

export default Question;
