// Recommendations.js
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link } from "react-router-dom";



const CARD_WIDTH = 300; // px
const CARD_GAP = 24; // px
const CARDS_VISIBLE = 3; // nombre de cartes visibles

const Recommendations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scrollIndex, setScrollIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!user?._id) {
      navigate("/login");
      return;
    }
    //fetch recommendations
    const fetchRecommendations = async () => {
      try {
        //fetch apprenant
        const apprenantRes = await fetch(`https://backendlms-5992.onrender.com/apprenant/by-user/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!apprenantRes.ok) {
          throw new Error(`recommendation.failedToFetchApprenant ${apprenantRes.status}`);
        }
        const apprenant = await apprenantRes.json();
        if (!apprenant?._id) {
          setError(t('recommendation.failedToFetchRecommendations'));
          setLoading(false);
          return;
        }
        const recRes = await fetch(
          `http://192.168.70.148:5000/recommend/${apprenant._id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        if (!recRes.ok) {
          throw new Error(`recommendation.failedToFetchRecommendationss ${recRes.status}`);
        }
        const data = await recRes.json();
        if (!data?.recommendations?.length) {
          setError(t('recommendation.noRecommendationsFound'));
        } else {
          setRecommendations(data.recommendations);
        }
      } catch (err) {
        console.error(t('recommendation.fetchError'), err);
        setError(t('recommendation.fetchErrorRecommendations'));
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [navigate]);

  //scroll to index
  const scrollToIndex = (index) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * (CARD_WIDTH + CARD_GAP),
        behavior: 'smooth',
      });
    }
    setScrollIndex(index);
  };
 
  //handle prev and next
  const handlePrev = () => {
    if (scrollIndex > 0) scrollToIndex(scrollIndex - 1);
  };
  //handle next
  const handleNext = () => {
    if (scrollIndex < recommendations.length - CARDS_VISIBLE) scrollToIndex(scrollIndex + 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {t('recommendation.title')}
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            {t('recommendation.subtitle')}
          </p>
        </div>
        {error && (
          <div className="text-center">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        )}
        {!error && recommendations.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-500 text-lg">
              {t('recommendation.noRecommendations')}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Flèches */}
            <button
              onClick={handlePrev}
              disabled={scrollIndex === 0}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full border border-gray-200 hover:bg-blue-50 transition ${scrollIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <ChevronLeftIcon className="h-6 w-6 text-blue-600" />
            </button>
            <button
              onClick={handleNext}
              disabled={scrollIndex >= recommendations.length - CARDS_VISIBLE}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full border border-gray-200 hover:bg-blue-50 transition ${(scrollIndex >= recommendations.length - CARDS_VISIBLE) ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <ChevronRightIcon className="h-6 w-6 text-blue-600" />
            </button>
            {/* Carrousel horizontal */}
            <div
              ref={scrollRef}
              className="flex overflow-x-auto no-scrollbar space-x-6 py-4 px-8"
              style={{ scrollBehavior: 'smooth' }}
            >
              {recommendations.map((course, idx) => (
                <div
                  key={course._id || course.courseId}
                  style={{ minWidth: CARD_WIDTH, maxWidth: CARD_WIDTH }}
                  className="bg-white rounded-2xl shadow-md border border-gray-100 flex-shrink-0 flex flex-col hover:shadow-xl transition-shadow duration-300"
                >
                  <img
                    src={`https://backendlms-5992.onrender.com/Public/Images/${course.image}`}
                    alt={course.nom}
                    className="w-full h-36 object-cover rounded-t-2xl"
                  />
                  <div className="p-4 flex flex-col flex-1">
                   
                    <h3 className="text-base font-bold text-gray-900 mb-1 truncate" title={course.nom}>{course.nom}</h3>
                 
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{course.description}</p>
                    <div className="flex items-center mb-2">
                      <span className="text-xs font-semibold text-[#e6913c] bg-gray-100 rounded px-2 py-0.5 mr-2">
                       {t('recommendation.level')} : {course.level}
                      </span>
                      
                    </div>
                    <span className="text-xs  font-medium text-gray-500 truncate  py-0.5 mr-2">{t('recommendation.language')} : {course.languages}</span>
                    <div className="mt-4 flex items-end justify-center ">
                      <button
                        onClick={() => {
                          const courseId = course._id || course.course_id || course.id;
                          if (!courseId) {
                            alert(t('recommendation.errorCourseId'));
                            return;
                          }
                          navigate(`/courses/${courseId}`);
                        }}
                        className="text-sm font-medium text-white bg-[#3f51b5] rounded-full hover:bg-blue-700 rounded px-3 py-1 transition"
                      >
                        {t('recommendation.viewCourse')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;











// http://localhost:5000
// import React, { useEffect, useState } from "react";

// const Recommendations = () => {
//   const [recommendations, setRecommendations] = useState([]);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchRecommendations = async () => {
//       try {
//         const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
        
//         if (!user?.id) {
//           setError("Please login to view recommendations");
//           setLoading(false);
//           return;
//         }

//         const response = await fetch(
//           `http://localhost:5000/recommend/${user.id}`,
//           {
//             headers: {
//               Authorization: `Bearer ${user.token}`, // If using JWT
//             },
//           }
//         );

//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
        
//         if (!data?.recommendations?.length) {
//           setError("No recommendations found based on your profile");
//         } else {
//           setRecommendations(data.recommendations);
//         }
//       } catch (err) {
//         setError(err.message || "Failed to fetch recommendations");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRecommendations();
//   }, []); // Consider adding dependencies if needed

//   if (loading) {
//     return <div className="p-6">Loading recommendations...</div>;
//   }

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-semibold mb-4">Recommended Courses</h2>
//       {error && <p className="text-red-500">{error}</p>}
      
//       {!error && recommendations.length === 0 ? (
//         <p className="text-gray-500">No recommendations available at the moment</p>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {recommendations.map((course) => (
//             <div 
//               key={course._id || course.courseId} // Use actual unique identifier
//               className="bg-white shadow-md p-4 rounded-lg hover:shadow-lg transition-shadow"
//             >
//               <h3 className="font-bold text-lg mb-2">{course.title}</h3>
//               <p className="text-sm text-gray-600 truncate">{course.description}</p>
//               <div className="mt-2 text-xs text-blue-600">
//                 {course.level && <span className="mr-2">Level: {course.level}</span>}
//                 {course.languages && <span>Languages: {course.languages.join(', ')}</span>}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Recommendations;