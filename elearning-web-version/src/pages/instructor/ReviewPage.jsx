import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReview, fetchCourses } from '../../api';

const ReviewCard = ({ review }) => {
  const rating = Math.round(review.rating);

  return (
    <div className="bg-white shadow rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-800">
          {review.apprenant_id?.userId?.name || "Unknown User"}
        </h3>
        <span className="text-sm text-gray-500">
          {new Date(review.dateEnvoi).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-1">
        <strong>Course:</strong> {review.courseId?.nom || "Unknown Course"}
      </p>
      <p className="text-sm text-gray-700 mb-2">"{review.message}"</p>
      
      {/* Affichage des étoiles */}
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-300"}>
            ★
          </span>
        ))}
      </div>
    </div>
  );
}

const ReviewPage = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewItems, setReviewItems] = useState([]);
  const [professorCourses, setProfessorCourses] = useState([]);

  const reviews = useSelector((state) => state.aviss.aviss);
  const courses = useSelector((state) => state.courses.courses);
  const currentInstructor = useSelector((state) => state.authprof.prof) || {};

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger les reviews
        await dispatch(fetchReview());
        
        // Charger les cours
        await dispatch(fetchCourses());
        
        setError(null);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Unable to load reviews.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dispatch]);

  // Effet pour filtrer les cours du professeur
  useEffect(() => {
    if (courses && courses.length > 0) {
      console.log("All courses:", courses);
      console.log("Current instructor:", currentInstructor);
      
      // Utiliser l'ID du professeur à partir de la structure correcte
      const professorId = currentInstructor?._id;
      console.log("Professor ID:", professorId);
      
      if (!professorId) {
        console.warn("Instructor not properly authenticated or missing ID");
        return;
      }
      
      // Modifier la logique de filtrage pour prendre en compte la structure des données
      const filteredCourses = courses.filter(course => {
        // Vérifier si professeurId est un objet avec une propriété _id
        const courseProf = course.professeurId;
        
        if (typeof courseProf === 'object' && courseProf !== null) {
          console.log(`Course ${course._id} - professeurId._id: ${courseProf._id}`);
          return courseProf._id === professorId;
        } else if (courseProf) {
          // Si c'est directement l'ID
          return courseProf === professorId;
        }
        
        return false;
      });
      
      console.log("Professor courses filtered:", filteredCourses);
      setProfessorCourses(filteredCourses);
    } else {
      console.log("No courses available or not loaded yet");
    }
  }, [courses, currentInstructor]);

  // Effet pour filtrer les reviews selon les cours du professeur
  useEffect(() => {
    console.log("Reviews from redux:", reviews);
    console.log("Professor courses state:", professorCourses);
    
    if (reviews && reviews.length > 0) {
      if (professorCourses.length === 0) {
        console.warn("No courses found for this professor");
        
        // SOLUTION TEMPORAIRE : Montrer toutes les reviews si aucun cours n'est trouvé
        // Cette ligne peut être supprimée une fois que le filtrage de cours fonctionne
        setReviewItems(reviews);
        return;
      }
      
      // Récupérer les IDs des cours du professeur
      const courseIds = professorCourses.map((course) => course._id);
      console.log("Course IDs:", courseIds);
      
      // Filtrer les reviews pour ne montrer que celles des cours du professeur
      const filteredReviews = reviews.filter((review) => {
        // Vérifier si courseId est un objet ou un ID
        const reviewCourseId = review.courseId?._id || review.courseId;
        
        // Utiliser une correspondance souple pour les IDs
        const isIncluded = courseIds.some(id => 
          id && reviewCourseId && id.toString() === reviewCourseId.toString()
        );
        
        console.log(`Review ${review._id} courseId:`, reviewCourseId, "included:", isIncluded);
        return isIncluded;
      });
      
      console.log("Filtered reviews:", filteredReviews);
      setReviewItems(filteredReviews);
    } else {
      console.log("No reviews available");
      setReviewItems([]);
    }
  }, [reviews, professorCourses]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600 text-lg font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-800">Course Reviews</h1>
        <p className="text-gray-500 mt-1">View and manage course reviews from learners.</p>
      </div>

      {reviewItems && reviewItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviewItems.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">No reviews found for your courses.</p>
        </div>
      )}
    </div>
  );
};

export default ReviewPage;
