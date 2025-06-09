import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { deleteQuiz,setQuizs } from "../../redux/slices/quizSlice";
import { toast } from "react-toastify";
import { fetchCourses , fetchQuiz, getQuizByInstructor  } from "../../api";

const CourseQuizzesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer le professeur connecté, les cours et les quiz
  const currentProfessor = useSelector((state) => state.authprof.prof);
  const allCourses = useSelector((state) => state.courses.courses || []);
  const allQuizs = useSelector((state) => state.quizs.quizs || []);
  const allQuizsByInstructor = useSelector((state) => state.quizs.quizByInstructor || []);
  // Vérifier l'authentification
  useEffect(() => {
    if (!currentProfessor) {
      toast.warning("You must be logged in to access this page");
      navigate("/loginprof");
      return;
    }
  }, [currentProfessor, navigate]);

  // Charger les cours et les quiz
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
       const results = await getQuizByInstructor(currentProfessor._id);
       dispatch(setQuizs(results));
        setError(null);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Error loading data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

 
  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;

    try {
      const response = await axios.delete(
        `https://backendlms-5992.onrender.com/quiz/${quizToDelete._id}`
      );

      if (response.status === 200) {
        dispatch(deleteQuiz({ _id: quizToDelete._id }));
        setShowDeleteConfirmation(false);
        setQuizToDelete(null);
        await dispatch(fetchQuiz());
        alert("Quiz supprimé avec succès !");
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      if (error.response?.status === 404) {
        alert("Ce quiz n'existe plus.");
      } else if (error.response?.status === 403) {
        alert("Vous n'avez pas la permission de supprimer ce quiz.");
      } else {
        alert(error.response?.data?.message || "Erreur lors de la suppression du quiz.");
      }
    }
  };

  const initiateDelete = (quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteConfirmation(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setQuizToDelete(null);
  };

  // Afficher les 5 premières questions d'un quiz
  const getLimitedQuestions = (quiz) => {
    if (!quiz || !quiz.questionQuiz_id) return [];
    return quiz.questionQuiz_id.slice(0, 5);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Course Quizzes</h1>
        <p className="text-gray-600">Create and manage quizzes for your courses</p>
      </div>

      <div className="mb-6 flex justify-between">
        <div></div>
        <Link
          to="/instructor/quizzes/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create New Quiz
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      ) : allQuizsByInstructor.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <p className="text-yellow-700">You have not yet created any courses. Create a course first to be able to add quizzes.</p>
        </div>
      ) : allQuizsByInstructor.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <p className="text-yellow-700">You have not yet created any quizzes for your courses.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.isArray(allQuizsByInstructor) && allQuizsByInstructor.map((quiz) => (
            <div key={quiz._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {quiz.courseId?.nom || "Course not specified"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {quiz.questionQuiz_id.length} {quiz.questionQuiz_id.length > 1 ? "questions" : "question"}
                  </p>
                </div>
                <div className="flex space-x-2">
              
                  <Link 
                     to={`/instructor/quizzes/${quiz._id}/detail`}
                    className="inline-flex items-center px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
                  >
                    View
                  </Link>
                  <Link 
                    to={`/instructor/quizzes/${quiz._id}/edit`} 
                    className="inline-flex items-center px-3 py-1.5 text-sm text-green-600 bg-green-50 rounded-md hover:bg-green-100"
                  >
                    Edit
                  </Link>
                  <button 
                    onClick={() => initiateDelete(quiz)} 
                    className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Options</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Réponse correcte</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getLimitedQuestions(quiz).map((question, index) => (
                      <tr key={`${quiz._id}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{question.question}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {question.options?.length > 0 ? (
                            <ul className="list-disc pl-5">
                              {question.options.map((option, optIndex) => (
                                <li key={optIndex}>{option}</li>
                              ))}
                            </ul>
                          ) : (
                            "Aucune option"
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-green-600">{question.reponseCorrecte}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-semi-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-gray-100 rounded-2xl shadow-2xl p-8 max-w-md mx-auto relative animate-fadeIn">
            <div className="flex items-center gap-2 mb-6 border-b pb-3">
              <span className="bg-red-100 text-red-600 rounded-full p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                </svg>
              </span>
              <h2 className="text-xl font-bold text-gray-800">Confirm deletion</h2>
              <button
                onClick={cancelDelete}
                className="ml-auto text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mb-6 text-gray-600">Are you sure you want to delete this quiz?</p>
            <div className="flex justify-end space-x-4">
              <button onClick={cancelDelete} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition">Exit</button>
              <button onClick={handleDeleteQuiz} className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseQuizzesPage;
