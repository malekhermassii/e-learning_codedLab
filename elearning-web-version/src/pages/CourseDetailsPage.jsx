import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCourseById } from "../api";
import {
  isAuthenticated,
  hasActiveSubscriptionServer,
  getEnrolledCourses,
} from "../utils/auth";
import { getCurrentUser } from "../utils/auth";
import axios from "axios";
import { addQuestion, setQuestions } from "../redux/slices/questionSlice";
import { addAvis } from "../redux/slices/avisSlice";
import { io } from "socket.io-client";
import { useTranslation } from 'react-i18next';
import { fetchQuestion } from "../api";
const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language; // Get current language
  const { questions } = useSelector((state) => state.questions);
  const { userInfo } = useSelector((state) => state.auth.userInfo);


  // État local pour stocker les données du cours
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);

  const [isEnrolledLocal, setIsEnrolledLocal] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedModules, setExpandedModules] = useState({});
  const [userRating, setUserRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [question, setQuestion] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [modules, setModules] = useState([]);
  const [progression, setProgression] = useState(null);
  const [courseProgress, setCourseProgress] = useState(0);
  const [questionsCourse, setQuestionsCourse] = useState([]);
  const [isCourseFinished, setIsCourseFinished] = useState(false);
  const [isQuizDone, setIsQuizDone] = useState(false);
  const [user, setUser] = useState(null);

  // FETCH COURSE by id
  useEffect(() => {
    const fetchCourse = async () => {
      if (courseId) {
        try {
          setLoading(true);
          const courseData = await getCourseById(courseId);
          setCourse(courseData);
          // Mettre à jour les modules après avoir reçu les données du cours
          if (courseData && courseData.modules) {
            setModules(courseData.modules);
          } else {
            console.log("No modules found in course data");
          }
          console.log("Questions found:", courseData.question_id);
          if (courseData && courseData.question_id) {
            setQuestionsCourse(courseData.question_id);
          }

          // Charger les leçons complétées depuis le localStorage
          const savedProgress = localStorage.getItem(`course_${courseId}_progress`);
          if (savedProgress) {
            setCompletedLessons(JSON.parse(savedProgress));
          }

          setError(null);
        } catch (err) {
          console.error("Error fetching course:", err);
          setError(err.message || "Failed to load course details");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCourse();
  }, [courseId]);

  // Ajouter un useEffect pour surveiller les changements de course
  useEffect(() => {
    if (course && course.modules) {
      setModules(course.modules);
    }
  }, [course]);

  // FETCH QUESTION
  useEffect(() => {
    const fetchQuestions = async () => {
      if (courseId) {
        try {
          setLoadingQuestions(true);
          const response = await fetch(`http://192.168.70.148:4000/question`);
          const data = await response.json();
          dispatch(setQuestions(data));
        } catch (err) {
          console.error("Error fetching questions:", err);
        } finally {
          setLoadingQuestions(false);
        }
      }
    };

    fetchQuestions();
  }, [courseId, dispatch]);

  //notification pour new eroll
  useEffect(() => {
    // Initialisation de la connexion Socket.IO
    const socket = io("http://192.168.70.148:4000");

    // Écoute des notifications d'inscription
    socket.on("newEnrollment", (data) => {
      if (data.courseId === courseId) {
        // Mettre à jour l'état local si nécessaire
        setIsEnrolledLocal(true);
        // Afficher une notification toast
        const notification = new Notification(t('courseDetails.enrollSuccessNotification'), {
          body: t('courseDetails.enrollSuccess', { courseName: data.courseName }),
          icon: "/logo192.png"
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [courseId]);

  // test user authentifier
  useEffect(() => {
    // Check if user is already enrolled in this course
    if (isAuthenticated()) {
      const enrolledCourses = getEnrolledCourses();
      if (enrolledCourses.includes(courseId)) {
        setIsEnrolledLocal(true);
      }
    }
  }, [courseId]);

  //check enrollment 
  useEffect(() => {
    const checkEnrollment = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.get(`http://192.168.70.148:4000/enroll/check/${courseId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          });
        setIsEnrolledLocal(res.data.isEnrolled);
      } catch (e) {
        setIsEnrolledLocal(false);
      }
    };
    checkEnrollment();
  }, [courseId]);

  //FETCH USER PROGRESS
  useEffect(() => {
    if (course && course._id && isEnrolledLocal) {
      fetchUserProgress();
    }
  }, [course, isEnrolledLocal]);

  useEffect(() => {
    fetchQuestion();
  }, [dispatch]);

  //FETCH USER DATA
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await localStorage.getItem("userInfo")
          || sessionStorage.getItem("userInfo");
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error(
          t('courseDetails.errorLoadingUserData'),
          error
        );
      }
    };

    loadUser();
  }, []);


  const refreshModel = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await axios.post(`http://192.168.70.148:5000/refresh`,{
        headers: { Authorization: `Bearer ${token}` }
      });
    
    } catch (error) {
      console.error(error);
    }
  };

  //enroll fetch
  const handleEnrollClick = async () => {
    if (isEnrolledLocal) {
      handleContinueLearning();
      return;
    }
    if (!isAuthenticated()) {
      navigate("/login", { state: { from: `/courses/${courseId}` } });
      return;
    }
    setEnrollLoading(true);

    try {
      if (hasActiveSubscriptionServer()) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          throw new Error(t('courseDetails.authenticationTokenNotFound'));
        }

        const response = await axios.post(
          `http://192.168.70.148:4000/enroll/${courseId}`,
          {},
          {
            headers: {

              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",

            },

            validateStatus: function (status) {
              return status < 500; // Resolve only if status code is less than 500
            }
          }
        );

        if (response.status === 201) {
          setIsEnrolledLocal(true);
          // Mettre à jour le store Redux si nécessaire
          alert(t('courseDetails.enrollSuccess'));
          navigate("/enrollment-success", {
            state: { courseId, courseName: course.nom },
          });
          refreshModel();
        } else if (response.status === 404) {
          alert(t('courseDetails.subscriptionNotFound'));
          navigate("/subscribe");
        }
        else {
          // Gestion plus détaillée des erreurs

          const errorMsg = response.data?.message || t('courseDetails.unknownError');
          throw new Error(errorMsg);
        }
      } else {
        navigate("/subscribe");
      }
    } catch (error) {
      console.error(t('courseDetails.detailedError'), error);
      alert(
        error.message ||
        t('courseDetails.errorEnroll')
      );

      // Vérification supplémentaire de l'état d'inscription
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token) {
          const checkRes = await axios.get(`http://192.168.70.148:4000/enroll/check/${courseId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            });
          setIsEnrolledLocal(checkRes.data.isEnrolled);
        }
      } catch (checkError) {
        console.error(t('courseDetails.errorVerifyingRegistration'), checkError);
      }
    } finally {
      setEnrollLoading(false);
    }
  };

  //btn continuer learning
  const handleContinueLearning = async () => {
    const hasActiveSubscription = await hasActiveSubscriptionServer();
    if (hasActiveSubscription) {
     
      navigate(`/courses/${courseId}/content`);
    } else {
      alert(
        t('courseDetails.subscriptionExpired')
      );
      navigate(`/subscribe`);
    }
    
  };

  //poser question
  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!isEnrolledLocal) {
      alert(t('courseDetails.qa.mustBeEnrolled'));
      return;
    }

    if (question.length < 3) {
      alert(t('courseDetails.qa.pleaseEnterQuestion'));
      return;
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        throw new Error(t('courseDetails.authenticationTokenNotFound'));
      }

      const response = await axios.post(
        `http://192.168.70.148:4000/question/${courseId}`,
        { question: question },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 201) {

       const currentUser = getCurrentUser();
        const imageProfile = localStorage.getItem("image") || sessionStorage.getItem("image");
        // Créer un objet question complet avec les informations de l'utilisateur
   
        const newQuestion = {
          ...response.data.question,
          apprenant_id: {
            ...response.data.question.apprenant_id,
            userId: {
              name: currentUser?.name || "Anonymous",
              image: imageProfile || "default-user.png"
            }
          }
        };


        // Mettre à jour la liste des questions dans Redux
        dispatch(addQuestion(newQuestion));

        // Mettre à jour l'état local du cours avec la nouvelle question
        setCourse(prevCourse => ({
          ...prevCourse,
          question_id: [...prevCourse.question_id, newQuestion]
        }));

        alert(t('courseDetails.qa.questionSubmittedSuccessfully'));
        setQuestion("");
      }
    } catch (error) {
      console.error(t('courseDetails.qa.errorSendingQuestion'), error);
      alert(
        error.response?.data?.message ||
        t('courseDetails.qa.errorSendingQuestion')
      );
    }
  };

  //poser review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isEnrolledLocal) {
      alert(t('courseDetails.reviews.form.notEnrolled'));
      return;
    }

    if (!reviewContent.trim() || userRating === 0) {
      alert(t('courseDetails.reviews.pleaseWriteCommentAndRate'));
      return;
    }
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        throw new Error(t('courseDetails.authenticationTokenNotFound'));
      }
      const response = await axios.post(
        `http://192.168.70.148:4000/feedback/${courseId}`,
        {
          message: reviewContent.trim(),
          rating: userRating,
          nom: reviewTitle,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const currentUser = getCurrentUser();
        const imageProfile = localStorage.getItem("image") || sessionStorage.getItem("image");

      const newFeedback = {
        ...response.data.feedback,
        apprenant_id: {
          ...response.data.feedback.apprenant_id,
          userId: {
            name: currentUser?.name || "Anonymous",
            image: imageProfile || "default-user.png"
          }
        }
      };
      if (response.status === 201) {
        // Ajouter l'avis à l'état local du cours SANS dupliquer
        setCourse(prevCourse => ({
          ...prevCourse,
          feedback_id: [...prevCourse.feedback_id, newFeedback]
        }));

        alert(t('courseDetails.reviews.success'));
        setUserRating(0);

        setReviewContent("");
      }
    } catch (error) {
      console.error("", error);
      alert(
        error.response?.data?.message ||
        t('courseDetails.reviews.errorSendingReview')
      );
    }
  };

  //click video
  const handleVideoClick = async (video) => {
    const hasActiveSubscription = await hasActiveSubscriptionServer();
    if (hasActiveSubscription) {
      if (isEnrolledLocal) {
        const module = modules.find(m => m.videos && m.videos.some(v => v._id === video._id));
        const moduleIndex = modules.findIndex(m => m._id === module._id);
        const videoIndex = module.videos.findIndex(v => v._id === video._id);

        // Vérifier si c'est le premier module et la première vidéo
        if (moduleIndex === 0 && videoIndex === 0) {
          try {
           
            await initUserProgress(course._id, module._id, video._id);
            setSelectedVideo(video);
            setIsVideoModalOpen(true);
          } catch (error) {
            console.error(t('courseDetails.errorProgress'), error);
          }
          return;
        }
        // Vérifier si c'est un module ou une vidéo précédente
        if (moduleIndex < activeModule || (moduleIndex === activeModule && videoIndex < activeLesson)) {
          try {
            await initUserProgress(course._id, module._id, video._id);
            setSelectedVideo(video);
            setIsVideoModalOpen(true);
          } catch (error) {
            console.error(t('courseDetails.errorProgress'), error);
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
          alert(t('courseContent.lesson.completePreviousLessons'));
          return;
        }

        try {
          console.log(t('courseDetails.initializingProgress'), video._id);
          await initUserProgress(course._id, module._id, video._id);
          setSelectedVideo(video);
          setIsVideoModalOpen(true);
        } catch (error) {
          console.error(t('courseDetails.errorProgress'), error);
        }
      } else {
        alert(t('courseContent.lesson.mustBeEnrolled'));
      }
    } else {
      alert(t('courseContent.lesson.subscriptionExpired'));
      navigate(`/subscribe`);
    }
  };

  //fermer model video
  const closeVideoModal = async () => {
    if (selectedVideo) {
      const module = modules.find(m => m.videos && m.videos.some(v => v._id === selectedVideo._id));
      if (module) {
        try {
          await updateUserProgress(course._id, module._id, selectedVideo._id);
          // Ajouter la vidéo aux leçons complétées
          const newCompletedLessons = [...completedLessons, selectedVideo._id];
          setCompletedLessons(newCompletedLessons);
          // Sauvegarder la progression dans le localStorage
          localStorage.setItem(`course_${courseId}_progress`, JSON.stringify(newCompletedLessons));
          // Mettre à jour les indices actifs
          const moduleIndex = modules.findIndex(m => m._id === module._id);
          const videoIndex = module.videos.findIndex(v => v._id === selectedVideo._id);
          setActiveModule(moduleIndex);
          setActiveLesson(videoIndex);
        } catch (error) {
          console.error("Error updating progress:", error);
        }
      }
    }
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
  };

  // Vérifier si le cours est terminé et si le quiz a été fait
  useEffect(() => {
    if (course && course._id && isEnrolledLocal) {
      const checkCourseAndQuizStatus = async () => {
        try {
          const token = localStorage.getItem("token") || sessionStorage.getItem("token");
          if (!token) return;

          // Vérifier la progression du cours
          const progressResponse = await fetch(
            `http://192.168.70.148:4000/courseprogress/${course._id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            }
          );

          if (progressResponse.ok) {
            const progressData = await progressResponse.json();

            if (progressData && progressData.length > 0) {
              const courseProgresslocal = progressData[0].progressionCours || 0;
              setCourseProgress(courseProgresslocal);
              setProgression(progressData[0]);
              setIsCourseFinished(courseProgresslocal >= 100);
            }
          }

          // Vérifier si le quiz a été fait
          if (course.quizId) {
            try {
              const quizId = typeof course.quizId === 'object' ? course.quizId._id : course.quizId;
              const quizResults = await axios.get(`http://192.168.70.148:4000/quizResult/${quizId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              // Vérifier si le résultat du quiz existe et a un score
              if (quizResults.data && quizResults.data.score !== undefined) {
                setIsQuizDone(quizResults.data.score >= 17);
                
              } else {
                setIsQuizDone(false);
              }
            } catch (error) {
              console.error(t('courseDetails.errorCheckingQuiz'), {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
              });
              setIsQuizDone(false);
            }
          }
        } catch (error) {
          console.error(t('courseDetails.errorCheckingCourseAndQuizStatus'), error);
        }
      };

      checkCourseAndQuizStatus();
    }
  }, [course, isEnrolledLocal]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <p className="text-xl text-gray-500">{t('courseDetails.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-16 text-center px-4">
        <h2 className="text-2xl text-red-600 mb-4">{t('courseDetails.error.title')}</h2>
        <p className="text-gray-600 mb-4">
          {t('courseDetails.error.message')}
        </p>
        <p className="text-sm text-gray-500">Error: {error}</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <p className="text-xl text-gray-600">{t('courseDetails.error.notFound')}</p>
      </div>
    );
  }

  //INIT USER PROGRESS
  const initUserProgress = async (courseId, moduleId, videoId) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        console.error(t('courseDetails.authenticationTokenNotFound'));
        return;
      }
      const response = await fetch(
        `http://192.168.70.148:4000/progress/create/${courseId}/${moduleId}/${videoId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error initializing progress:', error);
    }
  };

//UPDATE USER PROGRESS
  const updateUserProgress = async (courseId, moduleId, videoId) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        console.error(t('courseDetails.authenticationTokenNotFound'));
        return;
      }
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
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  };

  //FETCH USER PROGRESS
  const fetchUserProgress = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        console.error(t('courseDetails.authenticationTokenNotFound'));
        return;
      }
      const response = await fetch(
        `http://192.168.70.148:4000/courseprogress/${course._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.length > 0) {
       
        // Mettre à jour la progression du cours
        setProgression(data[0]);
      
        setCourseProgress(data[0].progressionCours);

      }
    } catch (error) {
      console.error(t('courseDetails.errorLoadingProgress'), error);
    }
  };

  // Fonction pour naviguer vers le quiz
  const navigateToQuiz = () => {
    if (course?.quizId) {
      navigate(`/courses/${courseId}/quiz`, { state: { quizId: course.quizId, courseId , 
        courseName: currentLanguage === 'ar' ? course.nom_ar : course.nom } });
    } else {
      alert(t('courseDetails.quiz.notAvailable'));
    }
  };


  // Fonction pour formater en hh:mm:ss
  function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
      h > 0 ? String(h).padStart(2, '0') : null,
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0')
    ].filter(Boolean).join(':');
  }

  return (
    <>
      <div className="min-h-screen bg-white pt-16">
        <div className="relative h-[400px]">
          <div className="absolute inset-0">
            <img
              src={`http://192.168.70.148:4000/Public/Images/${course.image}`}
              alt={course.nom}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        </div>
        {/* COURSE DETAILS */}
        <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg">
              <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-center space-x-1 bg-white-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`relative px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 ease-in-out ${
                      activeTab === "overview"
                        ? "bg-gray-100 text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {t('courseDetails.tabs.overview')}
                    {activeTab === "overview" && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("qa")}
                    className={`relative px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 ease-in-out ${
                      activeTab === "qa"
                        ? "bg-gray-100 text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {t('courseDetails.tabs.qa')}
                    {activeTab === "qa" && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("avis")}
                    className={`relative px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 ease-in-out ${
                      activeTab === "avis"
                        ? "bg-gray-100 text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {t('courseDetails.tabs.reviews')}
                    {activeTab === "avis" && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></span>
                    )}
                  </button>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  {currentLanguage === 'ar' ? course.nom_ar : course.nom}
                </h1>
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <>
                    <div className="flex items-center gap-4 mb-8">
                      {course.professeurId && (
                        <>
                          <img
                            src={`http://192.168.70.148:4000/Public/Images/${course.professeurId.image}`}
                            alt={course.professeurId.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm text-gray-500">{t('courseDetails.about.createdBy')}</p>
                            <h1 className="font-medium text-gray-900">
                              {course.professeurId.name}
                            </h1>
                            <h3 className="font-medium text-blue-600">
                              {t('courseDetails.about.speciality')} : {currentLanguage === 'ar' ? course.professeurId.specialite_ar : course.professeurId.specialite}
                            </h3>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="prose max-w-none mb-10">
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        {t('courseDetails.about.title')}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {currentLanguage === 'ar' ? course.description_ar : course.description}
                      </p>
                    </div>

                    {/* COURSE CURRICULUM */}
                    {Array.isArray(course.modules) &&
                      course.modules.length > 0 && (
                        <div className="mt-10">
                          <h2 className="text-xl font-bold text-gray-800 mb-4">
                            {t('courseDetails.about.curriculum')}
                          </h2>
                          {/* Course Progress */}
                          <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {t('courseDetails.progress.title')}
                              </span>
                              <span className="text-sm font-medium text-[#1B45B4]">
                                {courseProgress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-[#1B45B4] h-2.5 rounded-full"
                                style={{ width: `${courseProgress}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="border rounded-lg overflow-hidden divide-y divide-gray-200">
                            {course.modules.map((module, index) => {
                              const totalDuration =
                                module.videos?.length || 0;

                              const isExpanded =
                                expandedModules[module._id] || false;

                              return (
                                <div key={module._id} className="bg-white">
                                  <div
                                    className="p-4 hover:bg-gray-50 flex justify-between items-center cursor-pointer"
                                    onClick={() =>
                                      setExpandedModules({
                                        ...expandedModules,
                                        [module._id]: !isExpanded,
                                      })
                                    }
                                  >
                                    <div>
                                      <h3 className="font-medium text-gray-900">
                                        {index + 1}. {currentLanguage === 'ar' ? module.titre_ar : module.titre}
                                      </h3>
                                      <p className="text-sm text-gray-500">
                                        {module.nbrVideo ||
                                          module.videos?.length ||
                                          0}{" "}
                                        {t('courseDetails.about.lessons')} • {totalDuration} {t('courseDetails.about.minutes')}
                                      </p>
                                    </div>
                                    <svg
                                      className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? "transform rotate-180" : ""
                                        }`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                      ></path>
                                    </svg>
                                  </div>

                                  {isExpanded && Array.isArray(module.videos) && (
                                    <div className="border-t border-gray-100 bg-gray-50 divide-y divide-gray-100">
                                      {module.videos.map((video, lessonIndex) => (
                                        <div
                                          key={video._id}
                                          className="p-3 pl-8 flex items-center justify-between hover:bg-gray-100 cursor-pointer"
                                          onClick={() => handleVideoClick(video)}
                                        >
                                          <div className="flex items-center">
                                            <svg
                                              className="w-5 h-5 text-blue-600 mr-3"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                              />
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                              />
                                            </svg>
                                            <div>
                                              <p className="text-sm font-medium text-gray-800">
                                                {lessonIndex + 1}. {currentLanguage === 'ar' ? video.titrevd_ar : video.titrevd}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                Durée: {video.duree || "N/A"}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {progression?.progressionCours >= 100 && !isQuizDone && course?.quizId && (
                            <div className="bg-white p-6 border border-gray-200 rounded-lg text-center mb-6">
                              <p className="font-bold mb-2">
                                {t('courseContent.completion.congratulations')}
                              </p>
                              <p className="mb-4">
                                {t('courseContent.completion.quizPrompt')}
                              </p>
                              <button
                                onClick={navigateToQuiz}
                                className="px-6 py-2 bg-[#1B45B4] text-white rounded-md hover:bg-blue-700 transition-colors"
                              >
                                {t('courseContent.completion.takeQuiz')}
                              </button>
                            </div>
                          )}
                          {/* Certificate message shown when course and quiz are completed */}
                          {progression?.progressionCours >= 100 && isQuizDone && course?.quizId && (
                            <div className="bg-white p-6 border border-gray-200 rounded-lg text-center mb-6">
                              <p className="font-bold mb-2">{t('courseContent.completion.courseCompleted')}</p>
                              <p className="mb-4">{t('courseContent.completion.successMessage')}</p>
                              <button
                                onClick={() => navigate(`/courses/${courseId}/certificate`,{ state: { score: score } })}
                                className="px-6 py-2 bg-[#1B45B4] text-white rounded-md hover:bg-blue-700 transition-colors"
                              >
                                {t('courseContent.completion.viewCertificate')}
                              </button>
                            </div>
                          )}

                        </div>
                      )}
                  </>
                )}
                {/* QA TAB */}
                {activeTab === "qa" && (
                  <div className="py-4">
                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        {t('courseDetails.qa.title')}
                      </h3>

                      {/* Liste des questions existantes */}
                      {Array.isArray(course.question_id) && course.question_id.length > 0 ? (
                        <div className="space-y-6 mb-8">
                          {course.question_id.map((q, index) => {
                            // Vérifier que q est un objet valide et a les propriétés nécessaires
                            if (!q || typeof q !== 'object' || !q.question) return null;

                            const questionText = typeof q.question === 'string' ? q.question : '';
                            const userName = q.apprenant_id?.userId?.name || "Unknown user";
                            const userImage = q.apprenant_id?.userId?.image || "default-user.png";
                            const date = q.dateEnvoi ? new Date(q.dateEnvoi).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '';
                            const response = q.reponse || '';
                            const professorName = course.professeurId?.name || "Professor";
                            const professorImage = course.professeurId?.image || "default-prof.png";

                            return (
                              <div
                                key={`${q._id || index}`}
                                className="bg-white rounded-lg shadow p-4"
                              >
                                <div className="flex items-start space-x-4">
                                  <img
                                    src={`http://192.168.70.148:4000/Public/Images/${userImage}`}
                                    alt={userName}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium text-gray-900">
                                        {userName}
                                      </h4>
                                      <span className="text-sm text-gray-500 justify-end">
                                        {date}
                                      </span>
                                    </div>
                                    <p className="text-gray-600 mt-2">
                                      {questionText}
                                    </p>
                                    {response && (
                                      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-start space-x-4">
                                          <img
                                            src={`http://192.168.70.148:4000/Public/Images/${professorImage}`}
                                            alt={professorName}
                                            className="w-10 h-10 rounded-full object-cover"
                                          />
                                          <div>
                                            <h5 className="font-medium text-gray-900">
                                              {professorName}
                                            </h5>
                                            <p className="text-gray-600 mt-1">
                                              {response}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          {t('courseDetails.qa.noQuestions')}
                        </p>
                      )}

                      {/* Formulaire pour poser une question */}
                      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
                        <form
                          className="space-y-4"
                          onSubmit={handleSubmitQuestion}
                        >
                          {isEnrolledLocal ? (
                            <>
                              <textarea
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                                placeholder={t('courseDetails.qa.form.placeholder')}
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                              ></textarea>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-[#3f51b5] text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                {t('courseDetails.qa.form.submit')}
                              </button>
                            </>
                          ) : (
                            <p className="bg-yellow-50 border border-yellow-100 rounded-lg p-6 text-center">
                              {t('courseDetails.qa.form.notEnrolled')}
                            </p>
                          )}
                        </form>
                      </div>
                    </div>
                  </div>
                )}
                {/* REVIEWS TAB */}
                {activeTab === "avis" && (
                  <div className="py-4">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {t('courseDetails.reviews.title')}
                    </h3>
                    {Array.isArray(course.feedback_id) &&
                      course.feedback_id.length > 0 ? (
                      <div className="space-y-6 mb-8">
                        {course.feedback_id.map((fb, index) => (
                          <div
                            key={`${fb._id}-${index}`}
                            className="border-b pb-6"
                          >
                            <div className="flex items-start space-x-4">
                              <img
                                src={`http://192.168.70.148:4000/Public/Images/${fb.apprenant_id?.userId?.image ||
                                  "default-user.png"
                                  }`}
                                alt={fb.apprenant_id?.userId?.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-gray-900">
                                    {fb.apprenant_id?.userId?.name ||
                                      "Unknown user"}
                                  </h4>
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-500">
                                      {new Date(fb.dateEnvoi).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    <div className="flex items-center">
                                      {[1, 2, 3, 4, 5].map((rating) => (
                                        <svg
                                          key={rating}
                                          className={`w-5 h-5 ${rating <= fb.rating
                                              ? "text-yellow-400"
                                              : "text-gray-300"
                                            }`}
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-gray-600 mt-2">{fb.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 mb-6">
                        {t('courseDetails.reviews.noReviews')}
                      </p>
                    )}

                    {/* FORM FOR REVIEW */}
                    <div className=" pt-4">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        {t('courseDetails.reviews.form.title')}
                      </h3>
                      {isEnrolledLocal ? (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <form onSubmit={handleSubmitReview}>
                            <div className="mb-6">
                              <label className="block text-gray-700 text-sm font-medium mb-2">
                                {t('courseDetails.reviews.form.rating')}
                              </label>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    type="button"
                                    className={`w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${rating <= userRating
                                        ? "bg-yellow-400 text-white ring-yellow-500"
                                        : "bg-gray-200 text-gray-400 hover:bg-gray-300 ring-gray-300"
                                      }`}
                                    onClick={() => setUserRating(rating)}
                                  >
                                    <svg
                                      className="w-6 h-6 mx-auto"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="mb-6">
                              <label
                                htmlFor="review-content"
                                className="block text-gray-700 text-sm font-medium mb-2"
                              >
                                {t('courseDetails.reviews.form.content')}
                              </label>
                              <textarea
                                id="review-content"
                                rows="4"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={t('courseDetails.reviews.form.placeholder')}
                                value={reviewContent}
                                onChange={(e) => setReviewContent(e.target.value)}
                                required
                              ></textarea>
                            </div>

                            <button
                              type="submit"
                              className="w-full md:w-auto px-6 py-2 bg-[#3f51b5] text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              {t('courseDetails.reviews.form.submit')}
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6 text-center">
                          <p className="text-gray-600 mb-4">
                            {t('courseDetails.reviews.form.notEnrolled')}
                          </p>
                          <button
                            onClick={handleEnrollClick}
                            disabled={enrollLoading}
                            className={`px-6 py-2 bg-gradient-to-r from-[#6A36FF] to-[#AC5FE6] text-white font-medium rounded-lg transition-opacity ${enrollLoading
                                ? "opacity-70 cursor-not-allowed"
                                : "hover:opacity-90"
                              }`}
                          >
                            {enrollLoading ? t('courseDetails.enroll.loading') : t('courseDetails.enroll.title')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-20">
                <div className="relative aspect-video">
                  <img
                    src={`http://192.168.70.148:4000/Public/Images/${course.image}`}
                    alt={course.nom}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-[#6A36FF] flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      <span className="text-gray-600">
                        {t('courseDetails.sidebar.lessons')} {course.modules?.length || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-[#6A36FF] flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span className="text-gray-600">
                        {t('courseDetails.sidebar.level')} {currentLanguage === 'ar' ? course.level_ar : course.level || "All Levels"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-[#6A36FF] flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-gray-600">
                        {t('courseDetails.sidebar.language')} {course.languages || "English"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-[#6A36FF] flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-600">
                        {t('courseDetails.sidebar.students')} {course.enrolledCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-[#6A36FF] flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-gray-600">
                        {t('courseDetails.sidebar.rating')} {course.averageRating?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                  </div>

                  {isEnrolledLocal ? (
                    <button
                      onClick={handleContinueLearning}
                      className="w-full bg-gradient-to-r from-[#6A36FF] to-[#AC5FE6] text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                      {t('courseDetails.sidebar.continueLearning')}
                    </button>
                  ) : (
                    <button
                      onClick={handleEnrollClick}
                      disabled={enrollLoading}
                      className={`w-full bg-gradient-to-r from-[#6A36FF] to-[#AC5FE6] text-white py-3 rounded-lg font-medium transition-opacity ${enrollLoading
                          ? "opacity-70 cursor-not-allowed"
                          : "hover:opacity-90"
                        }`}
                    >
                      {enrollLoading ? t('courseDetails.enroll.loading') : t('courseDetails.enroll.title')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour la lecture des vidéos */}
      {isVideoModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{selectedVideo.titrevd}</h3>
              <button
                onClick={closeVideoModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="aspect-video">
              <video
                controls
                className="w-full h-full"
                src={`http://192.168.70.148:4000/Public/Videos/${selectedVideo.url}`}
                onEnded={async () => {
                  if (selectedVideo) {
                    try {
                      const module = modules.find(m => m.videos.some(v => v._id === selectedVideo._id));
                      if (module) {
                    
                        await updateUserProgress(course._id, module._id, selectedVideo._id);
                        await fetchUserProgress();
                     
                      }
                    } catch (error) {
                      console.error("Error updating progress:", error);
                    }
                  }
                }}
              >
                {t('videoModal.yourBrowserDoesNotSupportVideo')}
              </video>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseDetailsPage;
