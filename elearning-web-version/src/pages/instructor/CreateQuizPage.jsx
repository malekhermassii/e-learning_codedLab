import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Field, Form, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { addQuiz } from "../../redux/slices/quizSlice";
import { fetchCourses, fetchQuiz } from "../../api";
import { toast } from "react-toastify";

const API_URL = "https://backendlms-5992.onrender.com";

const CreateQuizPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get instructor courses and quizzes from Redux store
  const allCourses = useSelector((state) => state.courses.courses || []);
  const allQuizs = useSelector((state) => state.quizs.quizs || []);
  const currentProfessor = useSelector((state) => state.authprof.prof);

  // Filter to get only this instructor's courses and quizzes
  const instructorCourses = allCourses.filter(course => {
    const courseProf = course.professeurId;
    if (typeof courseProf === "object" && courseProf !== null) {
      return courseProf._id === currentProfessor?._id;
    } else if (courseProf) {
      return courseProf === currentProfessor?._id;
    }
    return false;
  });

  const instructorQuizs = allQuizs.filter(quiz => {
    if (!quiz.courseId || !quiz.courseId._id) return false;
    return instructorCourses.some(course => course._id === quiz.courseId._id);
  });

  // Load courses and quizzes when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(fetchCourses()),
          dispatch(fetchQuiz())
        ]);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data. Please try again.");
      }
    };
    
    loadData();
  }, [dispatch]);

  const handleAddQuiz = async (values, { resetForm, setSubmitting }) => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier qu'il y a exactement 20 questions (exigence du backend)
      if (values.questions.length !== 20) {
        setError("Le quiz doit contenir exactement 20 questions selon les exigences du système.");
        toast.error("Le quiz doit contenir exactement 20 questions.");
        setLoading(false);
        setSubmitting(false);
        return;
      }
      
      // Vérifier que toutes les questions ont du contenu
      const incompleteQuestions = values.questions.filter(q => 
        !q.question.trim() || 
        q.options.filter(opt => opt.trim()).length < 2
      );
      
      if (incompleteQuestions.length > 0) {
        setError("Toutes les questions doivent avoir un texte et au moins 2 options.");
        toast.error("Des questions sont incomplètes. Veuillez les compléter.");
        setLoading(false);
        setSubmitting(false);
        return;
      }
      
      // Préparer les questions au format attendu par l'API
      const questionQuiz_id = values.questions.map(q => {
        const filteredOptions = q.options.filter(option => option.trim() !== '');
        return {
          question: q.question,
          options: filteredOptions,
          reponseCorrecte: filteredOptions[q.correctAnswer]
        };
      });
      
      // Préparer l'objet quiz au format attendu par l'API
      const quizData = {
        courseId: values.courseId,
      
        questionQuiz_id: questionQuiz_id  // Le contrôleur backend attend cette structure exacte
      };
      
      console.log("Creating quiz with data:", quizData);
      
      // Envoi des données au format exact attendu par le backend
      const response = await axios.post(
        `${API_URL}/quiz`,
        quizData,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("profToken")}`
          }
        }
      );
      
      if (response.status === 201) {
        const newQuiz = response.data.quiz || response.data;
        console.log("Quiz created successfully:", newQuiz);
        
        dispatch(addQuiz(newQuiz));
        toast.success("Quiz created successfully!");
        resetForm();
        navigate("/instructor/quizzes");
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      let errorMsg = "Failed to create quiz. Please try again.";
      
      if (error.response) {
        // Messages d'erreur spécifiques basés sur les codes d'erreur
        if (error.response.status === 409) {
          errorMsg = "Un quiz pour ce cours existe déjà.";
        } else if (error.response.status === 400) {
          errorMsg = error.response.data?.message || "Données de quiz invalides.";
        } else if (error.response.status === 500) {
          errorMsg = "Erreur serveur. Veuillez réessayer plus tard.";
        }
        
        // Utiliser le message d'erreur du serveur s'il est disponible
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

  // Validation Schema using Yup
  const validationSchema = Yup.object({
    courseId: Yup.string().required('Course selection is required'),
   
    questions: Yup.array().of(
      Yup.object({
        question: Yup.string().required('Question text is required'),
        options: Yup.array()
          .of(Yup.string().required('Option is required'))
          .min(2, 'At least two answer options are required'),
        correctAnswer: Yup.number().required('Correct answer must be selected'),
      })
    ).length(20, 'Exactly 20 questions are required')
  });

  // Initial values for Formik - créer 20 questions vides
  const initialValues = {
    courseId: '',
  
    questions: Array(20).fill().map(() => ({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
    }))
  };

  return (
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Quiz</h1>
        <p className="text-gray-600">Create assessments to test your students' knowledge</p>
        <p className="mt-2 text-amber-600 font-semibold">Note: The system requires exactly 20 questions for each quiz.</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <span>{error}</span>
        </div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleAddQuiz}
      >
        {({ values, setFieldValue, handleChange, isSubmitting }) => (
          <Form>
            {/* Basic Information Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quiz Details</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Course Selection */}
                <div>
                  <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    name="courseId"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a course</option>
                    {instructorCourses.map(course => {
                      const hasQuiz = instructorQuizs.some(quiz => quiz.courseId._id === course._id);
                      return (
                        <option 
                          key={course._id} 
                          value={course._id}
                          disabled={hasQuiz}
                        >
                          {course.nom} {hasQuiz ? "(Quiz already exists)" : ""}
                        </option>
                      );
                    })}
                  </Field>
                  <ErrorMessage name="courseId" component="p" className="mt-1 text-sm text-red-600" />
                  <p className="mt-1 text-sm text-gray-500">
                    Note: Un cours ne peut avoir qu'un seul quiz. Les cours avec un quiz existant sont désactivés.
                  </p>
                </div>

             
              </div>
            </div>

            {/* Questions Counter */}
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Questions ({values.questions.length}/20)</h3>
              <div className="text-sm">
                {values.questions.length === 20 ? (
                  <span className="text-green-600">✓ All questions ready</span>
                ) : (
                  <span className="text-amber-600">{20 - values.questions.length} more questions needed</span>
                )}
              </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-6">
              <FieldArray name="questions">
                {({ push, remove }) => (
                  <>
                    {values.questions.map((question, index) => (
                      <div key={index} className="bg-white rounded-lg shadow overflow-hidden mb-4">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                          <h3 className="text-lg font-medium text-gray-900">Question {index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="p-6 space-y-6">
                          {/* Question Text */}
                          <div>
                            <label htmlFor={`questions[${index}].question`} className="block text-sm font-medium text-gray-700 mb-1">
                              Question <span className="text-red-500">*</span>
                            </label>
                            <Field
                              as="textarea"
                              name={`questions[${index}].question`}
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Enter your question here"
                            />
                            <ErrorMessage name={`questions[${index}].question`} component="p" className="mt-1 text-sm text-red-600" />
                          </div>

                          {/* Answer Options */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Answer Options <span className="text-red-500">*</span>
                            </label>
                            {question.options.map((option, optIndex) => {
                              // Log pour déboguer la sélection
                              console.log(`Question ${index}, Option ${optIndex}, Current correctAnswer value: ${values.questions[index].correctAnswer}`);

                              return (
                                <div key={optIndex} className="flex items-center mb-4">
                                  <Field
                                    type="radio"
                                    name={`questions[${index}].correctAnswer`}
                                    value={optIndex}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                    // Ajouter un onChange explicite pour forcer la mise à jour
                                    onChange={() => {
                                      console.log(`Setting Q${index} correctAnswer to ${optIndex}`);
                                      setFieldValue(`questions[${index}].correctAnswer`, optIndex);
                                    }}
                                  />
                                  <Field
                                    type="text"
                                    name={`questions[${index}].options[${optIndex}]`}
                                    value={option}
                                    onChange={handleChange}
                                    className="ml-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder={`Option ${optIndex + 1}`}
                                  />
                                  <ErrorMessage
                                    name={`questions[${index}].options[${optIndex}]`}
                                    component="p"
                                    className="mt-1 text-sm text-red-600"
                                  />
                                </div>
                              );
                            })}
                          </div>

                          <ErrorMessage name={`questions[${index}].correctAnswer`} component="p" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>
                    ))}
                    
                    {values.questions.length < 20 && (
                      <div className="mt-4 text-center">
                        <button
                          type="button"
                          onClick={() => push({
                            question: '',
                            options: ['', '', '', ''],
                            correctAnswer: 0,
                          })}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Add Question ({values.questions.length}/20)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </FieldArray>
            </div>

            <div className="mt-6 text-right">
              <button
                type="submit"
                disabled={isSubmitting || loading || values.questions.length !== 20}
                className={`px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none ${
                  (isSubmitting || loading || values.questions.length !== 20) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting || loading ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CreateQuizPage;
