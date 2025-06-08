import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchQuestion, fetchCourses } from "../../api";
import axios from "axios";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";

const UserQuestionPage = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionItems, setQuestionItems] = useState([]);
  const [professorCourses, setProfessorCourses] = useState([]);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const questions = useSelector((state) => state.questions.questions);
  const courses = useSelector((state) => state.courses.courses);
  const currentInstructor = useSelector((state) => state.authprof.prof) || {};

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Charger les questions
        await dispatch(fetchQuestion());

        // Charger les cours
        await dispatch(fetchCourses());

        setError(null);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Unable to load questions.");
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
      const filteredCourses = courses.filter((course) => {
        // Vérifier si professeurId est un objet avec une propriété _id
        const courseProf = course.professeurId;

        if (typeof courseProf === "object" && courseProf !== null) {
          console.log(
            `Course ${course._id} - professeurId._id: ${courseProf._id}`
          );
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

  // Effet pour filtrer les questions selon les cours du professeur
  useEffect(() => {
    console.log("Questions from redux:", questions);
    console.log("Professor courses state:", professorCourses);

    if (!currentInstructor || !currentInstructor._id) {
      console.warn("No instructor logged in");
      setQuestionItems([]);
      return;
    }

    if (questions && questions.length > 0) {
      if (professorCourses.length === 0) {
        console.warn("No courses found for this professor");
        setQuestionItems([]);
        return;
      }

      // Récupérer les IDs des cours du professeur
      const courseIds = professorCourses.map((course) => course._id);
      console.log("Course IDs:", courseIds);

      // Filtrer les questions pour ne montrer que celles des cours du professeur
      const filteredQuestions = questions.filter((question) => {
        const questionCourseId = question.courseId?._id || question.courseId;
        return courseIds.some(
          (id) =>
            id &&
            questionCourseId &&
            id.toString() === questionCourseId.toString()
        );
      });

      console.log("Filtered questions:", filteredQuestions);
      setQuestionItems(filteredQuestions);
    } else {
      console.log("No questions available");
      setQuestionItems([]);
    }
  }, [questions, professorCourses, currentInstructor]);

  // Réinitialiser le formulaire lors de la sélection d'une nouvelle question
  useEffect(() => {
    setResponseText("");
    setResponseSuccess(false);
  }, [selectedQuestion]);

  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question);
  };

  const handleResponseChange = (e) => {
    setResponseText(e.target.value);
  };
  const handleSubmitResponse = async (e) => {
    e.preventDefault();

    if (!selectedQuestion || !responseText.trim()) {
      setError("Please enter a response before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const token =
        localStorage.getItem("profToken") ||
        sessionStorage.getItem("profToken");
      if (!token) {
        throw new Error("Authentication token missing. Please log in again.");
      }

      const response = await axios.put(
        `http://192.168.70.148:4000/question/${selectedQuestion._id}/reponse`,
        { reponse: responseText }
      );

      // Optimisation : Mise à jour locale immédiate
      setQuestionItems((prev) =>
        prev.map((q) =>
          q._id === selectedQuestion._id ? { ...q, reponse: responseText } : q
        )
      );

      setSelectedQuestion((prev) => ({ ...prev, reponse: responseText }));
      setResponseSuccess(true);
      setResponseText("");

      // Rafraîchissement différé pour meilleure UX
      setTimeout(() => dispatch(fetchQuestion()), 1000);
    } catch (error) {
      // Gestion d'erreur plus détaillée
      if (error.response) {
        if (error.response.status === 401) {
          setError("Session expired. Please log in again.");
          localStorage.removeItem("profToken");
          sessionStorage.removeItem("profToken");
          navigate("/loginprof", {
            state: {
              message: "Your session has expired. Please log in again.",
            },
          });
        } else if (error.response.status === 403) {
          setError("You are not authorized to answer this question.");
        } else {
          setError(error.response.data.message || "Failed to submit response.");
        }
      } else {
        setError(error.message || "Failed to submit response.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Ajout de l'écouteur Socket.IO pour les notifications
  useEffect(() => {
    const socket = io("http://192.168.70.148:4000");

    socket.on("connect", () => {
      console.log("Connecté au serveur Socket.IO");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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
        <h1 className="text-3xl font-extrabold text-gray-800">
        Student Questions
        </h1>
          <p className="text-gray-500 mt-1">
            Gérez et répondez aux questions de vos apprenants.
        </p>
      </div>

      {!currentInstructor ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You must be logged in as an instructor to see questions.
              </p>
            </div>
          </div>
        </div>
      ) : professorCourses.length === 0 ? (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                You don't have any courses assigned yet. No questions to display.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Questions List */}
          <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="px-4 py-3 border-b font-medium text-gray-700 bg-gray-50">
              Questions List
            </div>
            {questionItems.length > 0 ? (
              <ul className="divide-y">
                {questionItems.map((question) => (
                  <li
                    key={question._id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                      selectedQuestion?._id === question._id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleSelectQuestion(question)}
                  >
                    <p className="font-semibold text-gray-800">
                      {question.apprenant_id?.userId?.name || "Utilisateur inconnu"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {question.courseId?.nom || "Cours inconnu"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {question.question}
                    </p>
                    {question.reponse ? (
                      <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Answered
                      </span>
                    ) : (
                      <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        En attente
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No questions found for your courses.
              </div>
            )}
          </div>

          {/* Question Details */}
          <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-md p-6 border border-gray-100">
            {selectedQuestion ? (
              <>
                <div className="mb-6 border-b pb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedQuestion.apprenant_id?.userId?.name ||
                      "Unknown User"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Course:{" "}
                    <span className="font-medium text-gray-700">
                      {selectedQuestion.courseId?.nom || "Unknown Course"}
                    </span>
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-semibold text-gray-700">
                      Question:
                    </h3>
                    <p className="text-gray-800 whitespace-pre-line mt-1">
                      {selectedQuestion.question}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-md font-semibold text-gray-700">
                      Response:
                    </h3>
                    {selectedQuestion.reponse ? (
                      <p className="text-gray-800 whitespace-pre-line mt-1 p-3 bg-gray-50 rounded-md">
                        {selectedQuestion.reponse}
                      </p>
                    ) : (
                      <form onSubmit={handleSubmitResponse} className="mt-2">
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                          placeholder="Write your response here..."
                          value={responseText}
                          onChange={handleResponseChange}
                          required
                        ></textarea>

                        {responseSuccess && (
                          <div className="mt-2 p-2 bg-green-100 text-green-700 rounded-md">
                            Response submitted successfully!
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={submitting}
                          className={`mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            submitting ? "opacity-70 cursor-not-allowed" : ""
                          }`}
                        >
                          {submitting ? "Submitting..." : "Submit Response"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <svg
                  className="h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <p className="text-lg">Select a question to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserQuestionPage;
