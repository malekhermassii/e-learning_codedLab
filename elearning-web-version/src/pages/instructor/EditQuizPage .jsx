import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Field, Form, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { updateQuiz } from "../../redux/slices/quizSlice";
import { fetchCourses, getquizById } from "../../api";
import { toast } from "react-toastify";

const API_URL = "https://backendlms-5992.onrender.com";

const EditQuizPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { quizId } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialQuizData, setInitialQuizData] = useState(null);

  // Get instructor courses from Redux store
  const allCourses = useSelector((state) => state.courses.courses || []);
  const instructorCourses = allCourses;

  // Load courses and existing quiz data when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      setFetchLoading(true);
      try {
        // Fetch courses first
        await dispatch(fetchCourses());

        // Then fetch the specific quiz data
        if (quizId) {
          const quizData = await getquizById(quizId);
          
          // Map fetched data to Formik structure
          const formattedData = {
            courseId: quizData.courseId?._id || "",
            questions: quizData.questionQuiz_id.map((q) => ({
              question: q.question || "",
              options: q.options || ["", "", "", ""],
              // Find the index of the correct answer in the options array
              correctAnswer:
                q.options.findIndex((opt) => opt === q.reponseCorrecte) !== -1
                  ? q.options.findIndex((opt) => opt === q.reponseCorrecte)
                  : 0,
            })),
        
          };
          // Ensure exactly 20 questions for the form
          while (formattedData.questions.length < 20) {
            formattedData.questions.push({
              question: "",
              options: ["", "", "", ""],
              correctAnswer: 0,
            });
          }
         

          setInitialQuizData(formattedData);
        } else {
          setError("Quiz ID is missing.");
          toast.error("Quiz ID not found.");
        }
        setError(null); // Clear previous errors on successful fetch
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError("Failed to load quiz data. Please try again.");
        toast.error("Failed to load quiz data.");
      } finally {
        setFetchLoading(false);
      }
    };

    loadInitialData();
  }, [dispatch, quizId]);

  const handleUpdateQuiz = async (values, { resetForm, setSubmitting }) => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier qu'il y a exactement 20 questions
      if (values.questions.length !== 20) {
        setError("Le quiz doit contenir exactement 20 questions.");
        toast.error("Le quiz doit contenir exactement 20 questions.");
        setLoading(false);
        setSubmitting(false);
        return;
      }

      // Vérifier que toutes les questions ont du contenu
      const incompleteQuestions = values.questions.filter(
        (q) =>
          !q.question.trim() || q.options.filter((opt) => opt.trim()).length < 2
      );

      if (incompleteQuestions.length > 0) {
        setError(
          "Toutes les questions doivent avoir un texte et au moins 2 options."
        );
        toast.error("Des questions sont incomplètes.");
        setLoading(false);
        setSubmitting(false);
        return;
      }

      // Préparer les questions pour l'API
      const questionQuiz_id = values.questions.map((q) => {
        const filteredOptions = q.options.filter(
          (option) => option.trim() !== ""
        );
        return {
          question: q.question,
          options: filteredOptions,
          reponseCorrecte: filteredOptions[q.correctAnswer],
        };
      });

      // Préparer l'objet quiz pour l'API
      const quizData = {
        courseId: values.courseId,
        questionQuiz_id: questionQuiz_id,
       
      };

    

      // Envoi de la requête PUT
      const response = await axios.put(`${API_URL}/quiz/${quizId}`, quizData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("profToken")}`,
        },
      });

      // Utiliser 200 pour la réussite de la mise à jour
      if (response.status === 200) {
        const updatedQuiz = response.data.quiz || response.data; // Ajuster selon la réponse de l'API


        dispatch(updateQuiz(updatedQuiz));
        toast.success("Quiz updated successfully!");
        navigate("/instructor/quizzes"); // Redirection après succès
      } else {
        // Gérer les cas où le statut n'est pas 200 mais pas une erreur non plus (rare)
        setError(`Unexpected response status: ${response.status}`);
        toast.warning(`Received status ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating quiz:", error);
      let errorMsg = "Failed to update quiz. Please try again.";

      if (error.response) {
        if (error.response.status === 400) {
          errorMsg = error.response.data?.message || "Invalid quiz data.";
        } else if (error.response.status === 404) {
          errorMsg = "Quiz not found.";
        } else if (error.response.status === 500) {
          errorMsg = "Server error. Please try again later.";
        }
        if (error.response.data?.message) {
          errorMsg = error.response.data.message;
        }
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Validation Schema (même que pour la création)
  const validationSchema = Yup.object({
    courseId: Yup.string().required("Course selection is required"),
   
    questions: Yup.array()
      .of(
        Yup.object({
          question: Yup.string().required("Question text is required"),
          options: Yup.array()
            .of(Yup.string().required("Option is required"))
            .min(2, "At least two answer options are required"),
          correctAnswer: Yup.number().required(
            "Correct answer must be selected"
          ),
        })
      )
      .length(20, "Exactly 20 questions are required"),
  });

  // Initial values gérés par l'état initialQuizData
  // Utiliser un objet vide si les données ne sont pas encore chargées
  const formInitialValues = initialQuizData || {
    courseId: "",

    questions: Array(20)
      .fill()
      .map(() => ({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      })),
  };

  // Afficher le chargement pendant la récupération des données initiales
  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-4">Loading quiz data...</p>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Quiz</h1>
        <p className="text-gray-600">
          Update the details and questions for this quiz
        </p>
        <p className="mt-2 text-amber-600 font-semibold">
          Note: The system requires exactly 20 questions for each quiz.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <span>{error}</span>
        </div>
      )}

      <Formik
        initialValues={formInitialValues} // Utiliser les données chargées
        validationSchema={validationSchema}
        onSubmit={handleUpdateQuiz}
        enableReinitialize // Important pour mettre à jour le formulaire lorsque initialQuizData change
      >
        {({ values, setFieldValue, handleChange, isSubmitting }) => (
          <Form>
            {/* Section Informations de Base */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Quiz Details
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Sélection du Cours */}
                <div>
                  <label
                    htmlFor="courseId"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Course <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    name="courseId"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a course</option>
                    {instructorCourses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.nom}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="courseId"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

              </div>
            </div>

            {/* Compteur de Questions */}
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Questions ({values.questions.length}/20)
              </h3>
              {/* Indicateur si les 20 questions sont prêtes (pas modifiable ici) */}
            </div>

            {/* Section Questions */}
            <div className="space-y-6">
              <FieldArray name="questions">
                {({ push, remove }) => (
                  <>
                    {values.questions.map((question, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg shadow overflow-hidden mb-4"
                      >
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                          <h3 className="text-lg font-medium text-gray-900">
                            Question {index + 1}
                          </h3>
                          {/* Ne pas permettre de supprimer des questions en mode édition pour maintenir 20 */}
                        </div>
                        <div className="p-6 space-y-6">
                          {/* Texte de la Question */}
                          <div>
                            <label
                              htmlFor={`questions[${index}].question`}
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Question <span className="text-red-500">*</span>
                            </label>
                            <Field
                              as="textarea"
                              name={`questions[${index}].question`}
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Enter your question here"
                            />
                            <ErrorMessage
                              name={`questions[${index}].question`}
                              component="p"
                              className="mt-1 text-sm text-red-600"
                            />
                          </div>

                          {/* Options de Réponse */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Answer Options{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            {question.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className="flex items-center mb-4"
                              >
                                <Field
                                  type="radio"
                                  name={`questions[${index}].correctAnswer`}
                                  value={optIndex} // La valeur est l'index
                                  checked={
                                    values.questions[index].correctAnswer ===
                                    optIndex
                                  } // Gérer l'état coché
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <Field
                                  type="text"
                                  name={`questions[${index}].options[${optIndex}]`}
                                  className="ml-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  placeholder={`Option ${optIndex + 1}`}
                                />
                                <ErrorMessage
                                  name={`questions[${index}].options[${optIndex}]`}
                                  component="p"
                                  className="mt-1 text-sm text-red-600"
                                />
                              </div>
                            ))}
                          </div>

                          <ErrorMessage
                            name={`questions[${index}].correctAnswer`}
                            component="p"
                            className="mt-1 text-sm text-red-600"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Ne pas permettre d'ajouter des questions en mode édition */}
                  </>
                )}
              </FieldArray>
            </div>

            <div className="mt-6 text-right">
              <button
                type="submit"
                disabled={
                  isSubmitting || loading || values.questions.length !== 20
                }
                className={`px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none ${
                  isSubmitting || loading || values.questions.length !== 20
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isSubmitting || loading ? "Updating..." : "Update Quiz"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EditQuizPage;
