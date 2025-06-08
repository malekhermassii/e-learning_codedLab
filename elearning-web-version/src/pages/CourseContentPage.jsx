import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  isAuthenticated,
  hasActiveSubscription,
} from "../utils/auth";
import { getCourseById } from "../api";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from 'react-i18next';

const CourseContentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCourseFinished, setIsCourseFinished] = useState(false);
  const [isQuizDone, setIsQuizDone] = useState(false);
  const videoRef = useRef(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const { t, i18n } = useTranslation();
  const [modules, setModules] = useState([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const [progression, setProgression] = useState(null);
  const currentLanguage = i18n.language;

    // Vérifier l'accès au cours
  useEffect(() => {
    const checkAccess = async () => {
      const isAuth = isAuthenticated();
      const hasSubscription = hasActiveSubscription();
      console.log(t('courseContent.verification'), {
        isAuth,
        hasSubscription,
        courseId
      });

      if (!isAuth) {
        navigate("/login", { state: { from: `/courses/${courseId}/content` } });
        return false;
      }

      // Vérifier l'inscription via l'API
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          throw new Error(t('courseContent.error.tokenNotFound'));
        }

        console.log("courseContent.verificationn", token.substring(0, 20) + "...");
        const response = await axios.get(
          `http://192.168.70.148:4000/enroll/check/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Réponse de vérification d'inscription:", response.data);
        
        if (!response.data.isEnrolled) {
          //Inscription au cours
          try {
            const enrollResponse = await axios.post(
              `http://192.168.70.148:4000/enroll/${courseId}`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            console.log("Réponse d'inscription:", enrollResponse.data);
            setIsEnrolled(true);
          } catch (enrollError) {
            console.error("Erreur lors de l'inscription:", enrollError);
            if (hasSubscription) {
              console.log("L'utilisateur a un abonnement, redirection vers la page du cours");
              navigate(`/courses/${courseId}`);
              return false;
            }
          }
        } else {
          setIsEnrolled(true);
        }

        return true;
      } catch (error) {
        console.error("Erreur lors de la vérification de l'inscription:", error);
        return false;
      }
    };

    

    const fetchCourse = async () => {
      if (await checkAccess()) {
        try {
          const courseData = await getCourseById(courseId);
          console.log("Données complètes du cours:", JSON.stringify(courseData, null, 2));
          
          // Vérifier si le quiz existe dans les données du cours
          if (courseData && courseData.modules) {
            console.log("Modules trouvés:", courseData.modules);
            setModules(courseData.modules);
          } else {
            console.log("Aucun module trouvé dans les données du cours");
          }
          if (!courseData.quizId) {
            console.log("Aucun quiz trouvé pour ce cours");
            console.log("Structure du cours:", {
              id: courseData._id,
              nom: courseData.nom,
              modules: courseData.modules?.length,
              quizId: courseData.quizId,
              quiz: courseData.quizId ? "Présent" : "Absent"
            });
          } else {
            console.log("Quiz trouvé:", {
              quizId: courseData.quizId,
              quizDetails: courseData.quizId
            });
          }
          
          setCourse(courseData);

          // Initialiser les leçons complétées depuis le localStorage
          const savedProgress = localStorage.getItem(
            `course_${courseId}_progress`
          );
          if (savedProgress) {
            setCompletedLessons(JSON.parse(savedProgress));
          }
        } catch (error) {
          console.error("Erreur lors du chargement du cours:", error);
          toast.error(t('courseContent.error.loading'));
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCourse();
  }, [courseId, navigate]);

  // Check if course is completed whenever completedLessons changes
  useEffect(() => {
    let isMounted = true;

  const checkCourseStatus = async () => {
      if (course) {
        const totalLessons = course.modules.reduce(
          (total, module) => total + module.videos.length,
          0
        );
        const finished = completedLessons.length === totalLessons;
        if (isMounted) {
          setIsCourseFinished(finished);
        }

        // Check if quiz is completed
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          console.error("Token non trouvé");
          return;
        }
        console.log('course',course);
        try {
          console.log('Structure complète du cours:', JSON.stringify(course, null, 2));
          
          // Vérifier si course.quizId existe et sa structure
          if (!course.quizId) {
            console.log('Aucun quizId trouvé dans le cours');
            setIsQuizDone(false);
            return;
          }

          // Extraire le quizId en fonction de sa structure
          const quizId = typeof course.quizId === 'object' ? course.quizId._id : course.quizId;


          console.log('quizId',quizId);
          
          if (!quizId) {
            console.log('QuizId invalide:', course.quizId);
            setIsQuizDone(false);
            return;
          } 
          
          const quizResults = await axios.get(`http://192.168.70.148:4000/quizResult/${quizId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          if (isMounted) {
            console.log('Réponse complète du quiz:', quizResults);
            // Vérifier si le score est supérieur à 17
            const score = quizResults.data.score || 0;
            setIsQuizDone(score >= 17);
            console.log('Score du quiz:', score, 'Quiz terminé:', score > 17);
          }
        } catch (error) {
          console.error("Erreur détaillée lors de la vérification du quiz:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            quizId: course.quizId
          });
          if (isMounted) {
            setIsQuizDone(false);
          }
        }
      }
    };

    checkCourseStatus();

    return () => {
      isMounted = false;
    };
  }, [courseId, course, completedLessons]);

  useEffect(() => {
    if (course && course._id && isEnrolled) {
      fetchUserProgress();
    }
  }, [course, isEnrolled]);

  // Récupérer la progression de l'utilisateur
  const fetchUserProgress = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        console.error(t('courseContent.error.tokenNotFound'));
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
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.length > 0) {
        setProgression(data[0]);
        // Mettre à jour la progression du cours
        setCourseProgress(data[0].progressionCours || 0);
        console.log("t('courseContent.progression',", data[0]);
      }
    } catch (error) {
      console.error(t('courseContent.errorProgression'), error);
    }
  };

  // Gérer le clic sur un module
  const handleModuleClick = (index) => {
    // Vérifier si c'est le même module
    if (index === activeModule) {
      return;
    }
    // Vérifier si c'est un module précédent
    if (index < activeModule) {
      setActiveModule(index);
      setActiveLesson(0);
      return;
    }
    // Pour les modules suivants, vérifier si tous les modules précédents sont terminés
    let allPreviousCompleted = true;
    for (let i = 0; i < index; i++) {
      const module = course.modules[i];
      for (const video of module.videos) {
        if (!completedLessons.includes(video._id)) {
          allPreviousCompleted = false;
          break;
        }
      }
      if (!allPreviousCompleted) break;
    }

    if (!allPreviousCompleted) {
      alert(
        "You need to complete all previous modules before accessing this module."
      );
      return;
    }
    setActiveModule(index);
    setActiveLesson(0);
  };

  // Gérer le clic sur une leçon
  const handleLessonClick = (moduleIndex, lessonIndex) => {
    // Vérifier si c'est la même leçon
    if (moduleIndex === activeModule && lessonIndex === activeLesson) {
      return;
    }
    // Vérifier si c'est une leçon précédente
    if (
      moduleIndex < activeModule ||
      (moduleIndex === activeModule && lessonIndex < activeLesson)
    ) {
      setActiveModule(moduleIndex);
      setActiveLesson(lessonIndex);
      return;
    }

    // Pour les leçons suivantes, vérifier si toutes les leçons précédentes sont terminées
    let allPreviousCompleted = true;

    // Vérifier les modules précédents
    for (let i = 0; i < moduleIndex; i++) {
      const module = course.modules[i];
      for (const video of module.videos) {
        if (!completedLessons.includes(video._id)) {
          allPreviousCompleted = false;
          break;
        }
      }
      if (!allPreviousCompleted) break;
    }

    // Vérifier les leçons précédentes dans le module actuel
    if (allPreviousCompleted && moduleIndex === activeModule) {
      for (let i = activeLesson; i < lessonIndex; i++) {
        const video = course.modules[moduleIndex].videos[i];
        if (!completedLessons.includes(video._id)) {
          allPreviousCompleted = false;
          break;
        }
      }
    }

    if (!allPreviousCompleted) {
      alert(
      " You need to complete all previous lessons before accessing this lesson."
      );
      return;
    }

    setActiveModule(moduleIndex);
    setActiveLesson(lessonIndex);
  };

  // Gérer le clic sur le bouton de lecture/pause
  const toggleVideoPlayback = () => {
    setIsVideoPlaying(!isVideoPlaying);
  };

  // Gérer la complétion d'une leçon
  const toggleLessonCompletion = (lessonId) => {
    return;

  };

  // Calculer la progression du cours
  const calculateCourseProgress = () => {
    if (!course) return 0;

    const totalLessons = course.modules.reduce(
      (total, module) => total + module.videos.length,
      0
    );

    return Math.round((completedLessons.length / totalLessons) * 100);
  };


  //navigation next lesson
  const navigateToNextLesson = () => {
    const currentModule = course?.modules[activeModule];
    if (!currentModule) return;

    const currentVideoId = currentModule.videos[activeLesson]?._id;

    // Vérifier si la leçon actuelle est terminée
    if (!completedLessons.includes(currentVideoId)) {
      alert("Vous devez terminer cette leçon avant de passer à la suivante.");
      return;
    }

    // Si nous sommes à la dernière leçon du module actuel
    if (activeLesson === currentModule.videos.length - 1) {
      // Vérifier si nous sommes au dernier module
      if (activeModule === course.modules.length - 1) {
        return; // Ne rien faire si c'est la dernière leçon du dernier module
      }
      // Passer au premier module suivant
      setActiveModule(activeModule + 1);
      setActiveLesson(0);
    } else {
      // Passer à la leçon suivante dans le même module
      setActiveLesson(activeLesson + 1);
    }
  };

  //navigate previous lesson
  const navigateToPreviousLesson = () => {
    // If we're not at the first lesson of the current module
    if (activeLesson > 0) {
      setActiveLesson(activeLesson - 1);
    }
    // If we're at the first lesson but not the first module
    else if (activeModule > 0) {
      setActiveModule(activeModule - 1);
      // Go to the last lesson of the previous module
      setActiveLesson(course.modules[activeModule - 1].videos.length - 1);
    }
  };

  //navigate quiz
  const navigateToQuiz = async () => {
     navigate(`/courses/${courseId}/quiz`, { state: { quizId: course.quizId, courseId , 
      courseName: currentLanguage === 'ar' ? course.nom_ar : course.nom } });
  };

  //update progress
  const handleVideoEnded = async () => {
    if (isEnrolled) {
      const currentModule = course?.modules[activeModule];
      const currentVideo = currentModule?.videos[activeLesson];
      
      if (!currentModule || !currentVideo) {
        console.error("Module ou vidéo non trouvé");
        return;
      }

      try {
        // D'abord, initialiser la progression si ce n'est pas déjà fait
        console.log("Initialisation de la progression pour la vidéo:", currentVideo._id);
        await initUserProgress(course._id, currentModule._id, currentVideo._id);
        
        // Ensuite, mettre à jour la progression
        console.log("Mise à jour de la progression pour la vidéo:", currentVideo._id);
        const updatedProgress = await updateUserProgress(course._id, currentModule._id, currentVideo._id);
        console.log("Progression mise à jour:", updatedProgress);
        
        // Ajouter la vidéo aux leçons complétées
        const newCompletedLessons = [...completedLessons, currentVideo._id];
        setCompletedLessons(newCompletedLessons);
        
        // Sauvegarder la progression dans le localStorage
        localStorage.setItem(`course_${courseId}_progress`, JSON.stringify(newCompletedLessons));
        
        // Mettre à jour la progression du cours
        if (updatedProgress && updatedProgress.progressionCours) {
          setCourseProgress(updatedProgress.progressionCours);
        }
        
        console.log("Progression mise à jour avec succès");
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la progression:", error);
        // En cas d'erreur, on essaie au moins de sauvegarder localement
        const newCompletedLessons = [...completedLessons, currentVideo._id];
        setCompletedLessons(newCompletedLessons);
        localStorage.setItem(`course_${courseId}_progress`, JSON.stringify(newCompletedLessons));
      }
    } else {
      alert("Vous devez être inscrit pour accéder aux vidéos.");
    }
  };

  // Initialiser la progression de l'utilisateur
  const initUserProgress = async (courseId, moduleId, videoId) => {
    try {
      console.log('Initialisation de la progression avec:', { courseId, moduleId, videoId });
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        console.error("Token non trouvé");
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
        const errorData = await response.json().catch(() => ({}));
        console.error("Erreur d'initialisation:", errorData);
        // Si l'erreur est 409 (Conflict), cela signifie que la progression existe déjà
        if (response.status === 409) {
          console.log("La progression existe déjà");
          return;
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("Progression initialisée avec succès:", data);
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la progression:', error);
      throw error;
    }
  };

  // Mettre à jour la progression de l'utilisateur
  const updateUserProgress = async (courseId, moduleId, videoId) => {
    try {
      console.log('Mise à jour de la progression avec:', { courseId, moduleId, videoId });
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        console.error("Token non trouvé");
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
        const errorData = await response.json().catch(() => ({}));
        console.error("Erreur de mise à jour:", errorData);
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("Progression mise à jour avec succès:", data);
      setCourseProgress(data.progressionCours);
      setIsCourseFinished(data.progressionCours === 100);
      console.log('is quiz done',isQuizDone);
      console.log("courseProgress",courseProgress);
      console.log("isCourseFinished",isCourseFinished);
      return data;
     
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error);
      throw error;
    }
  };

  // Gérer le temps de mise à jour de la vidéo
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
    }
  };

  useEffect(() => {
    document.documentElement.dir = i18n.dir();
  }, [i18n.language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentLesson = course?.modules[activeModule]?.videos[activeLesson];
  

  // Définir les booléens pour le premier et dernier cours
  const isFirstLesson = activeModule === 0 && activeLesson === 0;
  const isLastLesson =
    course &&
    activeModule === course.modules.length - 1 &&
    activeLesson === course.modules[activeModule].videos.length - 1;

  return (
    <div className="min-h-screen bg-white pt-16">
      {" "}
      {/* Add pt-16 to prevent navbar overlap */}
      {/* Header */}
      <div className="bg-[#1B45B4] p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-white text-2xl font-bold">{ currentLanguage === 'ar' ? course?.nom_ar : course?.nom}</h1>
          <div className="text-blue-100 text-sm mt-1">
            {course?.modules?.length} {t('courseContent.header.sections')} 
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Course Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {t('courseContent.progress.title')}
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
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Content Area */}
          <div className="w-full md:w-2/3">
            {/* Video Player Area */}
            <div className="bg-black relative aspect-video rounded-lg mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                {!isVideoPlaying ? (
                  <button
                    onClick={toggleVideoPlayback}
                    className="bg-white/20 rounded-full p-4 hover:bg-white/30 transition-colors"
                  >
                    <svg
                      className="w-12 h-12 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {course?.modules[activeModule]?.videos[activeLesson]?.url ? (
                      <video
                        ref={videoRef}
                        className="w-full h-full"
                        controls
                        onEnded={handleVideoEnded}
                        onTimeUpdate={handleTimeUpdate}
                        src={`http://192.168.70.148:4000/Public/videos/${course.modules[activeModule].videos[activeLesson].url}`}
                      >
                        {t('courseContent.loading')}
                      </video>
                    ) : (
                      <div className="text-white text-lg">
                        {course?.modules[activeModule]?.videos[activeLesson]?.type === "video"
                          ? `${t('courseContent.lesson.lesson')}: ${course.modules[activeModule].videos[activeLesson].titrevd}`
                          : `${t('courseContent.lesson.lesson')} ${t('courseContent.lesson.of')} ${course.modules[activeModule].videos[activeLesson].type}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Barre de progression de la vidéo */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {t('courseContent.progress.videoProgress')}
                </span>
                <span className="text-sm font-medium text-[#1B45B4]">
                  {Math.round(videoProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-[#1B45B4] h-2.5 rounded-full"
                  style={{ width: `${videoProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Lesson Information */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ar' ? currentLesson?.titrevd_ar : currentLesson?.titrevd}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <span> • </span>
                 Duration : <span>{currentLesson?.duree}</span>
                <button
                  onClick={() => toggleLessonCompletion(currentLesson?._id)}
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                ></button>
              </div>

              {/* Module progress information */}
              <div className="text-sm text-gray-600">
                <span>{t('courseContent.lesson.module')} </span>
                <span className="font-medium">
                  {currentLanguage === 'ar' ? course?.modules[activeModule]?.titre_ar : course?.modules[activeModule]?.titre}
                </span>
                
              </div>
              <span className="text-gray-500"> • </span>
                <span className="text-gray-500">
                  {t('courseContent.lesson.lesson')} {activeLesson + 1} 
                </span>
              {/* Lesson navigation */}
              <div
                className={`flex justify-between mt-4 ${i18n.dir() === 'rtl' ? 'flex-row-reverse' : ''}`}
                dir={i18n.dir()}
              >
                {/* Bouton Précédent */}
                <button
                  onClick={navigateToPreviousLesson}
                  disabled={isFirstLesson}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-md ${
                    isFirstLesson
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-blue-600 text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {/* Flèche gauche en RTL, droite en LTR */}
                  {i18n.dir() === "rtl" ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  )}
                  {t('courseContent.lesson.previous')}
                </button>

                {/* Bouton Suivant */}
                <button
                  onClick={navigateToNextLesson}
                  disabled={isLastLesson}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-md ${
                    isLastLesson
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-blue-600 text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {t('courseContent.lesson.next')}
                  {/* Flèche droite en RTL, gauche en LTR */}
                  {i18n.dir() === "rtl" ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Completion message shown only when all lessons are completed and quiz not yet taken */}
            {isQuizDone === false && courseProgress === 100 && (
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
            {isQuizDone && courseProgress === 100 &&  (
              <div className="bg-white p-6 border border-gray-200 rounded-lg text-center mb-6">
                <p className="font-bold mb-2">{t('courseContent.completion.courseCompleted')}</p>
                <p className="mb-4">{t('courseContent.completion.successMessage')}</p>
                <button
                  onClick={() => navigate(`/courses/${courseId}/certificate`, { state: { score: score } })}
                  className="px-6 py-2 bg-[#1B45B4] text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {t('courseContent.completion.viewCertificate')}
                </button>
              </div>
            )}
          </div>

          {/* Course Contents Sidebar */}
          <div className="w-full md:w-1/3">
            <div className="bg-gradient-to-r from-[#6572EB29] to-[#6572EB00] rounded-lg p-4 sticky top-20">
              {" "}
              {/* Make sidebar sticky */}
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                {t('courseContent.sidebar.title')}
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </h2>
              {isEnrolled ? (
                <div className="divide-y divide-gray-200">
                  {course?.modules.map((module, moduleIndex) => (
                    <div key={module._id} className="py-3">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => handleModuleClick(moduleIndex)}
                      >
                        <h3 className="text-sm font-medium text-gray-900">
                          {currentLanguage === 'ar' ? module.titre_ar : module.titre}
                        </h3>
                        <div className="flex items-center text-gray-400 text-xs">
                          <span>{module.videos?.length} {t('courseContent.sidebar.videos')}</span>
                        </div>
                      </div>

                      {activeModule === moduleIndex && (
                        <div className="mt-2 space-y-2 pl-2">
                          {module.videos.map((video, videoIndex) => (
                            <div
                              key={video._id}
                              className={`flex items-center py-1 px-2 rounded-md text-sm ${
                                activeModule === moduleIndex &&
                                activeLesson === videoIndex
                                  ? "bg-white text-[#1B45B4]"
                                  : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                              }`}
                              onClick={() =>
                                handleLessonClick(moduleIndex, videoIndex)
                              }
                            >
                              <div className="mr-3 flex-shrink-0">
                                <svg
                                  className="w-4 h-4 text-gray-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                              </div>
                              <div className="flex-grow">
                                <p>{currentLanguage === 'ar' ? video.titrevd_ar : video.titrevd}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {video.duree}
                                  </span>
                                  <span className="ml-2">
                                    {completedLessons.includes(video._id) ? (
                                      <svg
                                        className="w-4 h-4 text-green-500"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                          clipRule="evenodd"
                                        ></path>
                                      </svg>
                                    ) : (
                                      <svg
                                        className="w-4 h-4 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M5 13l4 4L19 7"
                                        ></path>
                                      </svg>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="mb-3 text-gray-500">
                    {t('courseContent.sidebar.enrollPrompt')}
                  </div>
                  <button
                    onClick={() => navigate(`/courses/${courseId}`)}
                    className="px-4 py-2 bg-[#1B45B4] text-white rounded-md hover:bg-blue-700 transition"
                  >
                    {t('courseContent.sidebar.viewDetails')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseContentPage;
