import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ResultQuiz from "../components/resultatQuiz";
import { getCourseById, getquizById } from "../api";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from 'react-i18next';

const Quiz = ({ route, navigation }) => {
  const { courseId, quizId, courseName } = route.params;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t, i18n } = useTranslation();
  const [dataResult, setDataResult] = useState(null);
  const currentLanguage = i18n.language


  //charger les données du quiz
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        if (quizId) {
          setLoading(true);
          const quizData = await getquizById(quizId);
          setQuizData(quizData);
        } else {
          setError(t('quiz.noQuiz'));
        }
      } catch (err) {
        console.error(t('quiz.errorLoading'), err);
        setError(t('quiz.errorLoading'));
      } finally {
        setLoading(false);
      }
    };
    loadQuizData();
  }, [quizId]);

  //selectionner la reponse
  const handleSelectAnswer = (questionId, option) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };
  //aller a la question suivante
  const handleNextQuestion = () => {
    if (
      quizData &&
      currentQuestionIndex < quizData.questionQuiz_id.length - 1
    ) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      calculateResult();
    }
  };

  //aller a la question precedente
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };
  //calculer le resultat du quiz
  const calculateResult = () => {
    let totalScore = 0;
    let correctAnswers = 0;
    console.log("quizData :", quizData);
    if (quizData && quizData.questionQuiz_id) {
      quizData.questionQuiz_id.forEach((question) => {
        if (selectedAnswers[question._id] === question.reponseCorrecte) {
          correctAnswers++;
        }
      });
      totalScore = Math.round(
        (correctAnswers / quizData.questionQuiz_id.length) * 20
      );
    }
    setScore(totalScore);
    setShowResult(true);
    return totalScore;
  };

  //saver le resultat du quiz
  const saveQuizResult = async (finalScore) => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        Alert.alert(
          t('quiz.authenticationError'),
          t('quiz.pleaseLoginToPassQuiz'),
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login")
            }
          ]
        );
        return;
      }

      // Vérifier si toutes les questions ont été répondues
      const questionsNonRepondues = quizData.questionQuiz_id.filter(
        question => !selectedAnswers[question._id]
      );

      const scoreFinal = calculateResult();
      console.log("scoreFinal :", scoreFinal);

      if (questionsNonRepondues.length > 0) {
        Alert.alert(
          "Questions not answered",
          "Please answer all questions before submitting the quiz.",
          [{ text: "OK" }]
        );
        return;
      }

      // Préparer les réponses dans le format attendu par le backend
      const reponses = {};
      quizData.questionQuiz_id.forEach((question) => {
        const selectedOption = selectedAnswers[question._id];
        if (selectedOption) {
          const optionIndex = question.options.indexOf(selectedOption);
          reponses[question._id] = {
            reponse_choisie: selectedOption,
            est_correcte: selectedOption === question.reponseCorrecte
          };
        }
      });
      const quizResults = {
        score: scoreFinal,
        correctAnswers: scoreFinal,
        totalQuestions: quizData.questionQuiz_id.length,
        passed: scoreFinal >= 17,
        completed: true,
        timeSpent: quizData.duration * 60 ,
        submittedAt: new Date().toISOString(),
        answers: selectedAnswers,
      };

      const response = await fetch(
        `http://192.168.70.148:4000/passerQuiz/${quizData._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            reponses: quizResults
          }),
        }
      );

      if (response.status === 401) {
        Alert.alert(
          "Session expired",
          "Your session has expired. Please log in again.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login")
            }
          ]
        );
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error saving the result");
      }

      const data = await response.json();
      setDataResult(data);
      AsyncStorage.setItem(
        `course_${courseId}_quiz_results`,
        JSON.stringify(data)
      );


      // Afficher le résultat
      setScore(data.score);
      setShowResult(true);

      // Si le score est suffisant, proposer de télécharger le certificat
     
    } catch (error) {
      console.error("Error saving the result:", error);
      Alert.alert(
        "Error",
        error.message || "An error occurred while saving the result"
      );
    }
  };

  const retryQuiz = () => {
    setShowResult(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setScore(0);
    // ... tout ce qu'il faut pour recommencer
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#14348A" />
        <Text style={styles.loadingText}>{t('quiz.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('quiz.error')}</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.actionButtonText}>{t('quiz.backToCourse')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (
    !quizData ||
    !quizData.questionQuiz_id ||
     quizData.questionQuiz_id.length === 0
  ) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('quiz.noQuiz')}</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.actionButtonText}>{t('quiz.backToCourse')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const currentQuestion = quizData.questionQuiz_id[currentQuestionIndex];
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={{flexDirection: "row",maxWidth: "80%"}}>
          <Ionicons name="arrow-back" size={20} color="white" />
          <Text style={styles.backButtonText}> {t('quiz.quizTitle')}</Text>
          <Text style={styles.backButtonText}>{courseName}</Text>
          </View>  
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.quizContainer}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {t('quiz.question')} {currentQuestionIndex + 1}/{quizData.questionQuiz_id.length}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${((currentQuestionIndex + 1) /
                        quizData.questionQuiz_id.length) *
                      100
                      }%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>
              {currentLanguage === 'ar' ? currentQuestion.question_ar : currentQuestion.question}
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswers[currentQuestion._id] === option &&
                  styles.selectedOption,
                ]}
                onPress={() => handleSelectAnswer(currentQuestion._id, option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedAnswers[currentQuestion._id] === option &&
                    styles.selectedOptionText,
                  ]}
                >
                 {currentLanguage === 'ar' ? currentQuestion.options_ar[index] || option : option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[
                styles.navButton,
                currentQuestionIndex === 0 && styles.disabledButton,
              ]}
              onPress={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <Text style={styles.navButtonText}>{t('quiz.previous')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                styles.nextButton,
                !selectedAnswers[currentQuestion._id] && styles.disabledButton,
              ]}
              onPress={() => {
                if (
                  currentQuestionIndex <
                  quizData.questionQuiz_id.length - 1
                ) {
                  handleNextQuestion();
                } else {
                  saveQuizResult(); // Appelle passerQuiz ici
                }
              }}
              disabled={!selectedAnswers[currentQuestion._id]}
            >
              <Text style={styles.navButtonText}>
                {currentQuestionIndex < quizData.questionQuiz_id.length - 1
                  ? t('quiz.next')
                  : t('quiz.finish')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {showResult && (
        <ResultQuiz
          visible={showResult}
          score={score}
          isPassed={score >= 17}
          onReturnToCourse={() => navigation.goBack()}
          onGetCertificate={() =>{ navigation.navigate("Certificate", {
            certificatId: dataResult.certificat.id,
              score: dataResult.score,
              courseId
          })
        setShowResult(false)}}
          onRetryQuiz={retryQuiz}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#3949AB",
    padding: 16,
    height: 70,
    justifyContent:'center'
   
  },
  backButton: {
    flexDirection: "row",
    marginTop:18

    
  },
  backButtonText: {
    color: "white",
    marginLeft: 8,
    fontSize: 16,
   
  },
  scrollView: {
    flex: 1,
  },
  quizContainer: {
    padding: 16,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: "#383D5A",
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 3,
  },
  questionContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedOption: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedOptionText: {
    color: "white",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#6B7280",
  },
  nextButton: {
    backgroundColor: "#2563EB",
  },
  navButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    marginBottom: 20,
    textAlign: "center",
  },
  actionButton: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default Quiz;
