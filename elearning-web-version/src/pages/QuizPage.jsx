import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";
import { getCourseById, getQuizById } from "../api";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setCourses } from "../redux/slices/courseSlice";
import { useTranslation } from 'react-i18next';
import { toast } from "react-toastify";
const API_URL = "http://192.168.70.148:4000";

const QuizPage = (props) => {
   const dispatch = useDispatch();
   const location = useLocation();
   const { quizId, courseId: courseIdFromState , courseName} = location.state || {};
   const { courseId: courseIdFromParams } = useParams();
   const courseId = courseIdFromState || courseIdFromParams;
   const navigate = useNavigate();
   const [loading, setLoading] = useState(true);
   const [course, setCourse] = useState(null);
   const [quiz, setQuiz] = useState(null);
   const [idQuiz, setQuizId] = useState(null);
   const [currentQuestion, setCurrentQuestion] = useState(0);
   const [selectedAnswers, setSelectedAnswers] = useState({});
   const [timeRemaining, setTimeRemaining] = useState(0);
   const [quizSubmitted, setQuizSubmitted] = useState(false);
   const [results, setResults] = useState(null);
   const [error, setError] = useState(null);
   const [completedLessons, setCompletedLessons] = useState([]);
   const { t, i18n } = useTranslation();
   const currentLanguage = i18n.language; // Obtenir la langue actuelle


   //afficher quiz
   useEffect(() => {
     const loadQuiz = async () => {
     
       if (!isAuthenticated()) {
         navigate("/login", { state: { from: `/courses/${courseId}/quiz` } });
         return;
       }

       try {
         const token = localStorage.getItem("token") || sessionStorage.getItem("token");
         if (!token) {
           throw new Error(t('quiz.error.tokenNotFound'));
         }

         // Charger les données du cours
         const courseData = await getCourseById(courseId);
         setCourse(courseData);

         // Vérifier l'inscription via l'API
         const enrollResponse = await axios.get(
           `http://192.168.70.148:4000/enroll/check/${courseId}`,
           {
             headers: {
               Authorization: `Bearer ${token}`,
             },
           }
         );
         if (!enrollResponse.data.isEnrolled) {
           navigate(`/courses/${courseId}`);
           return;
         }

         // Charger les données du quiz by id
         const quizData = await getQuizById(quizId);
         if (
           !quizData ||
           !quizData.questionQuiz_id ||
           quizData.questionQuiz_id.length === 0
         ) {
           setError(t('quiz.error.noQuizFound'));
           setLoading(false);
           return;
         }
         setQuiz(quizData);
         setQuizId(quizData._id);
         setTimeRemaining((quizData.duration || 20) * 60);
         setLoading(false);
       } catch (error) {
         console.error(t('quiz.error.loading'), error);
         toast.error(t('quiz.error.loading'));
         navigate(`/courses/${courseId}/content`);
       }
     };
     loadQuiz();
   }, [idQuiz, courseId, navigate, t]);


//HANDLE ANSWER SELECT
   const handleAnswerSelect = (questionId, answerIndex) => {
     setSelectedAnswers({
       ...selectedAnswers,
       [questionId]: answerIndex,
     });
   };

   //HANDLE NEXT QUESTION
   const handleNextQuestion = () => {
     if (quiz && currentQuestion < quiz.questionQuiz_id.length - 1) {
       setCurrentQuestion(currentQuestion + 1);
     }
   };

   //HANDLE PREVIOUS QUESTION
   const handlePreviousQuestion = () => {
     if (currentQuestion > 0) {
       setCurrentQuestion(currentQuestion - 1);
     }
   };

   //envoyer quiz
   const handleSubmitQuiz = async () => {
     if (!quiz) {
       setError(t('quiz.error.unableToSubmit'));
       return;
     }
     if (!idQuiz) {
       setError(t('quiz.error.quizIdNotAvailable'));
       return;
     }
     const token = localStorage.getItem("token") || sessionStorage.getItem("token");
         if (!token) {
           throw new Error(t("quiz.error.tokenNotFound"));
         }
     // Préparation des réponses au format attendu par l'API
     const reponses = {};
     Object.keys(selectedAnswers).forEach((questionId) => {
       reponses[questionId] = selectedAnswers[questionId];
     });
     try {
       // Enregistrer les résultats localement pour l'affichage
       const score = calculateScore();
       const passed = score >= 17; // 17/20 est le critère de réussite selon le contrôleur

       const quizResults = {
         score,
         correctAnswers: score,
         totalQuestions: quiz.questionQuiz_id.length,
         passed,
         completed: true,
         timeSpent: quiz.duration * 60 - timeRemaining,
         submittedAt: new Date().toISOString(),
         answers: selectedAnswers,
       };
       // console.log("Quiz Results:", quizResults);
       localStorage.setItem(
         `course_${courseId}_quiz_results`,
         JSON.stringify(quizResults)
       );

       // Envoyer les résultats au serveur
       const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
       if (userId) {
         const response = await axios.post(`${API_URL}/passerQuiz/${quizId}`, {
           reponses: quizResults,
            },
            {
             headers: {
               Authorization: `Bearer ${token}`,
             },
            }
      );
         console.log(t('quiz.results.submitted'), response.data);
       }

       setResults(quizResults);
       setQuizSubmitted(true);
     } catch (err) {
       console.error("Error saving results:", err);
     
     }
   };

   //calcule score
   const calculateScore = () => {
     if (!quiz || !quiz.questionQuiz_id) return 0;
     let correctAnswers = 0;
     quiz.questionQuiz_id.forEach((question, index) => {
       console.log(`-- Question ${index + 1} (${question._id}) --`);

       const userAnswerIndex = selectedAnswers[question._id];
       const correctAnswerText = question.reponseCorrecte;

       console.log(
         `User Answer (Index): ${userAnswerIndex} (Type: ${typeof userAnswerIndex})`
       );
       console.log(
         `Correct Answer Text: '${correctAnswerText}' (Type: ${typeof correctAnswerText})`
       );
       // Vérifier si l'index de réponse de l'utilisateur est valide
       if (
         userAnswerIndex !== undefined &&
         userAnswerIndex >= 0 &&
         userAnswerIndex < question.options.length
       ) {
         const userAnswerText = question.options[userAnswerIndex];
         console.log(
           `User Answer Text: '${userAnswerText}' (Type: ${typeof userAnswerText})`
         );

         // Comparer le texte de la réponse de l'utilisateur avec le texte de la réponse correcte
         if (userAnswerText === correctAnswerText) {
           console.log(" -> Correct!");
           correctAnswers += 1;
         } else {
           console.log(" -> Incorrect.");
         }
       } else {
         console.log(" -> Invalid user answer index.");
       }
     });

     console.log("Final Score:", correctAnswers);
     return correctAnswers;
   };

     // Timer for quiz
     useEffect(() => {
       if (!loading && !quizSubmitted && timeRemaining > 0 && quiz) {
         const timer = setTimeout(() => {
           setTimeRemaining(timeRemaining - 1);
         }, 1000);
   
         return () => clearTimeout(timer);
       } else if (timeRemaining === 0 && !quizSubmitted && quiz) {
         // Auto-submit when time is up
         handleSubmitQuiz();
       }
     }, [timeRemaining, loading, quizSubmitted, quiz]);
   
   const formatTime = (seconds) => {
     const minutes = Math.floor(seconds / 60);
     const remainingSeconds = seconds % 60;
     return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
   };

   //HANDLE NAVIGATE TO CERTIFICATE
   const navigateToCertificate = () => {
     navigate(`/courses/${courseId}/certificate`,{ state: { score: results.score } });
   };

   //HANDLE NAVIGATE TO COURSE PAGE
   const navigateToCoursePage = () => {
     navigate(`/courses/${courseId}`);
   };

   if (loading) {
     return (
       <div className="min-h-screen bg-gray-50 flex justify-center items-center pt-16">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
       </div>
     );
   }

   if (error) {
     return (
       <div className="min-h-screen bg-gray-50 pt-16 pb-12">
         <div className="max-w-4xl mx-auto px-4 py-8">
           <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
             <svg
               className="w-16 h-16 text-red-500 mx-auto mb-4"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
             >
               <path
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 strokeWidth="2"
                 d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
               ></path>
             </svg>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('quiz.errors.notAvailable')}</h2>
             <p className="text-gray-600 mb-6">
               {t('quiz.errors.noQuiz')}
             </p>
             <button
               onClick={navigateToCoursePage}
               className="px-6 py-3 bg-[#1B45B4] text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
             >
               {t('quiz.returnToCourse')}
             </button>
           </div>
         </div>
       </div>
     );
   }

   if (quizSubmitted && results) {
     return (
       <div className="min-h-screen bg-gray-50 pt-16 pb-12">
         <div className="max-w-4xl mx-auto px-4 py-8">
           <div className="bg-white rounded-xl shadow-md overflow-hidden">
             <div className="p-8">
               <div className="text-center mb-8">
                 <h1 className="text-3xl font-bold text-gray-900 mb-4">
                   {t('quiz.results.title')}
                 </h1>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <div className="bg-gray-50 p-6 rounded-lg">
                   <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('quiz.results.score')}</h3>
                   <div className="flex items-center justify-center">
                     <div className="relative">
                       <svg className="w-32 h-32">
                         <circle
                           className="text-gray-200"
                           strokeWidth="8"
                           stroke="currentColor"
                           fill="transparent"
                           r="56"
                           cx="64"
                           cy="64"
                         />
                         <circle
                           className={`${results.passed ? 'text-green-500' : 'text-red-500'}`}
                           strokeWidth="8"
                           strokeDasharray={`${(results.score / 20) * 352} 352`}
                           strokeLinecap="round"
                           stroke="currentColor"
                           fill="transparent"
                           r="56"
                           cx="64"
                           cy="64"
                         />
                       </svg>
                       <div className="absolute inset-0 flex items-center justify-center">
                         <span className={`text-3xl font-bold ${results.passed ? 'text-green-500' : 'text-red-500'}`}>
                           {results.score}/20
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="bg-gray-50 p-6 rounded-lg">
                   <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('quiz.results.details')}</h3>
                   <div className="space-y-3">
                     <div className="flex justify-between">
                       <span className="text-gray-600">{t('quiz.results.totalQuestions')}</span>
                       <span className="font-medium">{results.totalQuestions}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">{t('quiz.results.correctAnswers')}</span>
                       <span className="font-medium text-green-600">{results.correctAnswers}</span>
                     </div>
                     
                   </div>
                 </div>
               </div>

               <div className={`p-4 rounded-lg mb-8 ${results.passed ? 'bg-blue-50' : 'bg-red-50'}`}>
                 <div className="flex items-center">
                   {results.passed ? (
                     <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   ) : (
                     <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   )}
                   <p className={`text-lg font-medium ${results.passed ? 'text-green-800' : 'text-red-800'}`}>
                     {results.passed ? t('quiz.results.success.message') : t('quiz.results.failure.message')}
                   </p>
                 </div>
               </div>

               <div className="flex flex-col md:flex-row justify-center gap-4">
                 {results.passed ? (
                   <>
                     <button
                       onClick={navigateToCertificate}
                       className="px-6 py-3 bg-[#1B45B4] text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                     >
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       {t('quiz.results.viewCertificate')}
                     </button>
                     <button
                       onClick={navigateToCoursePage}
                       className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg shadow-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                     >
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                       </svg>
                       {t('quiz.results.returnToCourse')}
                     </button>
                   </>
                 ) : (
                   <>
                     <button
                       onClick={() => window.location.reload()}
                       className="px-6 py-3 bg-[#1B45B4] text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                     >
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                       </svg>
                       {t('quiz.results.tryAgain')}
                     </button>
                     <button
                       onClick={navigateToCoursePage}
                       className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg shadow-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                     >
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                       </svg>
                       {t('quiz.results.returnToCourse')}
                     </button>
                   </>
                 )}
               </div>
             </div>
           </div>
         </div>
       </div>
     );
   }

   // Guard against null quiz
   if (!quiz) {
     return (
       <div className="min-h-screen bg-gray-50 pt-16 pb-12">
         <div className="max-w-4xl mx-auto px-4 py-8">
           <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
             <h2 className="text-2xl font-bold text-gray-900 mb-2">
               {t('quiz.errors.notAvailable')}
             </h2>
             <p className="text-gray-600 mb-6">
               {t('quiz.errors.noQuiz')}
             </p>
             <button
               onClick={navigateToCoursePage}
               className="px-6 py-3 bg-[#1B45B4] text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
             >
               {t('quiz.returnToCourse')}
             </button>
           </div>
         </div>
       </div>
     );
   }

   const currentQuestionData = quiz.questionQuiz_id[currentQuestion];

   return (
     <div className="min-h-screen bg-gray-50 pt-16 pb-12">
       <div className="max-w-4xl mx-auto px-4 py-8">
         {/* Quiz Header */}
         <div className="mb-8">
           <div className="bg-gradient-to-r  rounded-xl p-6 shadow-sm">
             <h1 className="text-2xl md:text-3xl font-extrabold text-[#1B45B4] text-center mb-2">
               Quiz <span className="font-bold text-[#6572EB]">: {currentLanguage === 'ar' ? course?.nom_ar : courseName}</span>
             </h1>
          
           </div>
           <div className="flex justify-end mt-4 mb-4">
               <div className="bg-blue-100 text-blue-800 text-sm px-4 py-1 rounded-full shadow">
                 {t('quiz.question')} {currentQuestion + 1} {t('quiz.question.of')} {quiz.questionQuiz_id.length}
               </div>
             </div>
         </div>

         {/* Quiz Description and Instructions */}
         <div className="bg-gradient-to-r from-[#6572EB29] to-[#6572EB00] rounded-xl shadow-md overflow-hidden mb-6">
           <div className="p-6">
             <p className="text-gray-700">
               {t('quiz.instructions')}
             </p>
             <div className="mt-3 text-sm text-gray-600">
               <p>• {t('quiz.instructions')}</p>
               <p>• {t('quiz.results.failure.message')}</p>
             </div>
           </div>
         </div>

         {/* Question Card */}
         {currentQuestionData && (
           <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
             <div className="p-6">
               <h2 className="text-xl font-semibold text-gray-900 mb-4">
                 {currentLanguage === 'ar' ? currentQuestionData.question_ar : currentQuestionData.question}
               </h2>

               <div className="space-y-3">
                 {currentQuestionData.options.map((option, index) => (
                   <div
                     key={index}
                     className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                       selectedAnswers[currentQuestionData._id] === index
                         ? "border-blue-600 bg-blue-50"
                         : "border-gray-200 hover:bg-gray-50"
                     }`}
                     onClick={() =>
                       handleAnswerSelect(currentQuestionData._id, index)
                     }
                   >
                     <div className="flex items-center">
                       <div
                         className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                           selectedAnswers[currentQuestionData._id] === index
                             ? "bg-blue-600 text-white"
                             : "border border-gray-300"
                         }`}
                       >
                         {selectedAnswers[currentQuestionData._id] === index && (
                           <svg
                             className="w-3 h-3"
                             fill="currentColor"
                             viewBox="0 0 20 20"
                           >
                             <path
                               fillRule="evenodd"
                               d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                               clipRule="evenodd"
                             ></path>
                           </svg>
                         )}
                       </div>
                       <span>{currentLanguage === 'ar' ? currentQuestionData.options_ar?.[index] || option : option}</span>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         )}

         {/* Navigation */}
         <div className="flex justify-between">
           <button
             onClick={handlePreviousQuestion}
             disabled={currentQuestion === 0}
             className={`px-4 py-2 rounded-lg ${
               currentQuestion === 0
                 ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                 : "bg-gray-200 text-gray-700 hover:bg-gray-300"
             }`}
           >
             {t('quiz.navigation.previous')}
           </button>

           {currentQuestion < quiz.questionQuiz_id.length - 1 ? (
             <button
               onClick={handleNextQuestion}
               className="px-4 py-2 bg-[#1B45B4] text-white rounded-lg hover:bg-blue-700"
             >
               {t('quiz.navigation.next')}
             </button>
           ) : (
             <button
               onClick={handleSubmitQuiz}
               className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
             >
               {t('quiz.navigation.submit')}
             </button>
           )}
         </div>

         {/* Quiz Progress */}
         <div className="mt-8">
           <div className="flex justify-between text-sm text-gray-600 mb-2">
             <span>{t('quiz.progress.completed')}</span>
             <span>
               {Math.round(
                 (Object.keys(selectedAnswers).length /
                   quiz.questionQuiz_id.length) *
                   100
               )}
               % {t('quiz.progress.completed')}
             </span>
           </div>
           <div className="w-full bg-gray-200 rounded-full h-2.5">
             <div
               className="bg-[#1B45B4] h-2.5 rounded-full"
               style={{
                 width: `${
                   (Object.keys(selectedAnswers).length /
                     quiz.questionQuiz_id.length) *
                   100
                 }%`,
               }}
             ></div>
           </div>
           <div className="flex flex-wrap gap-2 mt-4">
             {quiz.questionQuiz_id.map((question, index) => (
               <button
                 key={question._id}
                 onClick={() => setCurrentQuestion(index)}
                 className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                   currentQuestion === index
                     ? "bg-[#1B45B4] text-white"
                     : selectedAnswers[question._id] !== undefined
                     ? "bg-blue-100 text-blue-800"
                     : "bg-gray-200 text-gray-700"
                 }`}
               >
                 {index + 1}
               </button>
             ))}
           </div>
         </div>
       </div>
     </div>
   );
};

export default QuizPage;
