import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { isAuthenticated, getCurrentUser, getEnrolledCourses, hasActiveSubscriptionServer } from '../utils/auth';
import { coursesData } from '../data/coursesData';
import { extendedCoursesData } from '../data/extendedCoursesData';
import { useTranslation } from 'react-i18next';
import { fetchAllProgress } from '../api';
import axios from 'axios';


const MyCoursesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState({});
  const [activeTab, setActiveTab] = useState('ongoing'); // 'ongoing' ou 'completed'
  const [quizResults, setQuizResults] = useState({});
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;


  const [completedProgress, setCompletedProgress] = useState([]);
  const [ongoingProgress, setOngoingProgress] = useState([]);

  const { quizId, courseId, courseName } = location.state || {};

  // Fonction pour récupérer les résultats des quiz
  const fetchQuizResults = async (quizId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`https://backendlms-5992.onrender.com/quizResult/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats du quiz:', error);
      return null;
    }
  };

  //CHECK IF USER IS AUTHENTICATED
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: '/my-courses' } });
      return;
    }
    // Get current user data
    const userData = getCurrentUser();
    setUser(userData);
    // retourne les identifiants des cours auxquels l'utilisateur est inscrit
    const userEnrolledCourses = getEnrolledCourses();
    // First try to get course details from extended data for richer information
    const extendedCourseDetails = userEnrolledCourses.map(courseId => {
      return (
        extendedCoursesData.find(course => course.id === parseInt(courseId)) ||
        coursesData.find(course => course.id === parseInt(courseId)) || 
        { id: courseId, title: 'Unknown Course', image: 'https://via.placeholder.com/300' }
      );
    });
    setEnrolledCourses(extendedCourseDetails);
    // Calculate progress for each course
    const progressData = {};
    userEnrolledCourses.forEach(courseId => {
      const savedProgressStr = localStorage.getItem(`course_${courseId}_progress`);
      if (savedProgressStr) {
        const completedLessons = JSON.parse(savedProgressStr);
        const course = extendedCoursesData.find(c => c.id === parseInt(courseId));
        
        if (course) {
          const totalLessons = course.modules.reduce(
            (total, module) => total + module.lessons.length, 
            0
          );
          progressData[courseId] = {
            completed: completedLessons.length,
            total: totalLessons,
            percentage: Math.round((completedLessons.length / totalLessons) * 100),
            lastLesson: completedLessons.length > 0 ? 
              getLastCompletedLesson(course, completedLessons) : null
          };
        }
      } else {
        progressData[courseId] = { completed: 0, total: 0, percentage: 0, lastLesson: null };
      }
    });
    setCourseProgress(progressData);
    setLoading(false);
  }, [navigate]);

  //LOAD all progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const { completed, ongoing } = await fetchAllProgress();
        setCompletedProgress(completed);
        setOngoingProgress(ongoing);

        // Récupérer les résultats des quiz pour chaque cours
        const quizResultsData = {};
        for (const course of [...completed, ...ongoing]) {
          if (course.courseId && course.courseId._id) {
            const result = await fetchQuizResults(course.courseId.quizId);
            if (result) {
              quizResultsData[course.courseId._id] = result;
            }
          }
        }
        // Mise à jour de l'état
        setQuizResults(quizResultsData);
        
      } catch (error) {
        console.error(t('instructorLayout.errorLoadingProgress'), error);
      }
    };
    loadProgress();
  }, [courseId]);

  // Ajouter un useEffect séparé pour surveiller les changements de quizResults
  useEffect(() => {
    console.log("t('instructorLayout.quizResultsUpdated')", quizResults);
  }, [quizResults]);

  // Helper to get the last completed lesson info
  const getLastCompletedLesson = (course, completedLessons) => {
    if (!course || !completedLessons.length) return null;
    
    const lastCompletedId = completedLessons[completedLessons.length - 1];
    
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (lesson.id === lastCompletedId) {
          return {
            title: lesson.title,
            moduleTitle: module.title
          };
        }
      }
    }
    
    return null;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

//HANDLE CONTINUE LEARNING
  const handleContinueLearning = async (course) => { 
    const hasActiveSubscription = await hasActiveSubscriptionServer();
    if (hasActiveSubscription) {
      navigate(`/courses/${course.courseId._id}/content`);
    } else {
      alert(
        t('myCourses.subscriptionExpired')
      );
      navigate(`/subscribe`);
    }
  }

//HANDLE TAKE QUIZ
  const handleTakequiz= async (course) => {
    const hasActiveSubscription = await hasActiveSubscriptionServer();
    if (hasActiveSubscription) {
      console.log('course', course)
      
      navigate(`/courses/${course.courseId._id}/quiz`, { state: { quizId: course.courseId.quizId, courseId , 
        courseName: currentLanguage === 'ar' ? course.courseId.nom_ar : course.courseId.nom } });
    } else {
      alert(
        t('myCourses.subscriptionExpired')
      );
      navigate(`/subscribe`);
    }
  }

//HANDLE START LEARNING:
  const handleStartLearning = async (course) => {
    const hasActiveSubscription = await hasActiveSubscriptionServer();
    if (hasActiveSubscription) {
      navigate(`/courses/${course.courseId._id}`);
    } else {
      alert(
        t('myCourses.subscriptionExpired')
      );
      navigate(`/subscribe`);
    }
  }

//RENDER COURSE CARD
  const renderCourseCard = (course) => {
    // Vérifier si course et courseId existent
    if (!course || !course.courseId) {
      console.error(t('myCourses.courseDataInvalid'), course);
      return null;
    }
    // Vérifier si le quiz est complété via l'API
    const quizResult = quizResults[course.courseId._id];
    const isQuizCompleted = quizResult?.score >= 17;
    const quizScore = quizResult?.score || 0;
   
    return (
      <div 
        key={course._id} 
        className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all"
      >
        <div className="md:flex">
          <div className="md:w-1/2 h-55">
            <img 
              src={`https://backendlms-5992.onrender.com/Public/Images/${course.courseId.image || 'default-course.jpg'}`}
              alt={course.courseId.nom || 'Course'} 
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-6 md:w-2/3">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900 truncate">{course.courseId.nom || 'Untitled Course'}</h3>
            </div>

            <div className="text-sm text-gray-600 mb-4 flex justify-between items-center">
              <p className="mb-1">
                {t('myCourses.enrolled')} {course.courseId.enrolledCount || 0}
              </p>
              {quizScore > 0 && (
                      <p className="text-gray-600 mb-3">Score: {quizScore}</p>
                    )}
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{t('myCourses.progress')}</span>
                <span className="text-gray-600">{course.progressionCours || 0}% {t('myCourses.complete')}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-[#3f51b5] h-2.5 rounded-full" 
                  style={{ width: `${course.progressionCours || 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-4">
              {course.progressionCours > 0 && course.progressionCours < 100 ? (
                <Link 
                  
                  onClick={() => handleContinueLearning(course)}
                  className="flex-1 bg-[#3f51b5] text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  {t('myCourses.continueLearning')} 
                </Link>
              ) : course.progressionCours === 100 ? (
                isQuizCompleted ? (
                  <Link 
                    to={`/courses/${course.courseId._id}/certificate`}
                    state={{ score: quizResults[course.courseId._id]?.score }}
                    className="flex-1 bg-[#3f51b5] text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    {t('myCourses.viewCertificate')}
                  </Link>
                ) : (
                  <div className="flex justify-between items-center w-full">
                   
                    {!isQuizCompleted && (
                      <Link 
                        onClick={() => handleTakequiz(course)}
                        state={{ quizId: course.courseId.quizId, courseId : course.courseId._id , 
                          courseName: currentLanguage === 'ar' ? course.courseId.nom_ar : course.courseId.nom }}
                        className="flex-1 bg-[#3f51b5] text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        {t('myCourses.takeQuiz')}
                      </Link>
                    )}
                  </div>
                )
              ) : (
                <Link 
                onClick={() => handleStartLearning(course)}
                  className="flex-1 bg-[#3f51b5] text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  {t('myCourses.startLearning')}
                </Link>
              )}
              
              <Link 
                to={`/courses/${course.courseId._id}`}
                className="text-gray-700 bg-gray-100 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                {t('myCourses.details')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Remplacer filteredCourses par les états appropriés
  const displayCourses = activeTab === 'completed' ? completedProgress : ongoingProgress;
  
  // Filtrer les cours invalides
  const validCourses = displayCourses.filter(course => course && course.courseId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('myCourses.title')}</h1>
          <p className="text-gray-600">{t('myCourses.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('ongoing')}
              className={`${
                activeTab === 'ongoing'
                  ? 'border-[#3f51b5] text-[#3f51b5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('myCourses.tabs.ongoing')} ({ongoingProgress.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`${
                activeTab === 'completed'
                  ? 'border-[#3f51b5] text-[#3f51b5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('myCourses.tabs.completed')} ({completedProgress.length})
            </button>
          </nav>
        </div>

        {validCourses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {validCourses.map(course => renderCourseCard(course))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-blue-50 mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
                <path fillRule="evenodd" d="M10 9a2 2 0 100-4 2 2 0 000 4zm1 2.586l4 4-4-4zm-2 0L5 15.586l4-4z" clipRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {activeTab === 'ongoing' 
                ? t('myCourses.noCourses.ongoing.title') 
                : t('myCourses.noCourses.completed.title')}
            </h2>
            <p className="text-gray-600 mb-6">
              {activeTab === 'ongoing'
                ? t('myCourses.noCourses.ongoing.description')
                : t('myCourses.noCourses.completed.description')}
            </p>
            <Link
              to="/courses"
              className="inline-block bg-[#3f51b5] text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t('myCourses.noCourses.browse')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoursesPage; 