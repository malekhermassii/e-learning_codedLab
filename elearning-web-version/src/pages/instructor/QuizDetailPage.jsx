import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getquizById } from '../../api';

const QuizDetailPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const quizData = await getquizById(quizId);
        setQuiz(quizData);
        setError(null);
      } catch (err) {
        console.error("Error loading quiz:", err);
        setError("Error loading quiz");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded-lg">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="bg-yellow-100 p-4 rounded-lg">
        <p className="text-yellow-700">Quiz not found</p>
        <Link 
          to="/instructor/quizzes" 
          className="mt-2 inline-block bg-yellow-600 text-white px-4 py-2 rounded-md"
        >
          Back to Quizzes
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Details</h1>
         
            <p className="text-gray-600">Course: {quiz.courseId?.nom || "Not specified"}</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Link 
              to={`/instructor/quizzes/${quizId}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Edit Quiz
            </Link>
            <button 
              onClick={() => {
                navigate(`/instructor/quizzes/${quizId}/results`, {
                  state: { coursName: quiz.courseId?.nom }
                });
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              View Results
            </button>
            <Link
              to="/instructor/quizzes"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Quizzes
            </Link>
          </div>
        </div>
      </div>

      {/* General quiz information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">General Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Number of questions</p>
            <p className="text-lg font-medium">{quiz.questionQuiz_id?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Associated course</p>
            <p className="text-lg font-medium">{quiz.courseId?.nom || "Not specified"}</p>
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Quiz Questions</h3>
        
        {quiz.questionQuiz_id && quiz.questionQuiz_id.length > 0 ? (
          <div className="space-y-4">
            {quiz.questionQuiz_id.map((question, index) => (
              <div key={question._id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                </div>
                <div className="p-4">
                  <p className="text-gray-900 font-medium mb-4">{question.question}</p>
                  
                  {/* Options */}
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Options:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {question.options && question.options.map((option, optIndex) => (
                        <li 
                          key={optIndex} 
                          className={`${option === question.reponseCorrecte ? 'text-green-600 font-medium' : 'text-gray-700'}`}
                        >
                          {option}
                          {option === question.reponseCorrecte && (
                            <span className="ml-2 text-xs text-green-600">(Correct answer)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Correct answer:</p>
                    <p className="text-green-600 font-medium">{question.reponseCorrecte}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-yellow-700">No questions have been added to this quiz.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizDetailPage;

