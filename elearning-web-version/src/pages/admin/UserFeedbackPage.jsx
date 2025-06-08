import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchQuestion } from "../../api";
import { useTranslation } from "react-i18next";

const UserFeedbackPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionItems, setQuestionItems] = useState([]);

  const questions = useSelector((state) => state.questions.questions);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        await dispatch(fetchQuestion());
        setError(null);
      } catch (err) {
        setError(t("userFeedback.error"));
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, [dispatch, t]);

  useEffect(() => {
    if (questions) {
      setQuestionItems(questions);
    }
  }, [questions]);

  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question);
  };

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
        <h1 className="text-3xl font-extrabold text-gray-800">{t("userFeedback.title")}</h1>
        <p className="text-gray-500 mt-1">{t("userFeedback.subtitle")}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Questions List */}
        <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="px-4 py-3 border-b font-medium text-gray-700 bg-gray-50">
            {t("userFeedback.questionsList")}
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
                    {question.apprenant_id?.userId?.name || t("userFeedback.unknownUser")}
                  </p>
                  <p className="text-xs text-gray-500">{question.courseId?.nom || t("userFeedback.unknownCourse")}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{question.question}</p>
                  {question.reponses?.length > 0 && (
                    <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {t("userFeedback.responses", { count: question.reponses.length })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-gray-500">{t("userFeedback.noQuestions")}</div>
          )}
        </div>

        {/* Question Details */}
        <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-md p-6 border border-gray-100">
          {selectedQuestion ? (
            <>
              <div className="mb-6 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedQuestion.apprenant_id?.userId?.name || t("userFeedback.unknownUser")}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t("userFeedback.details.course")}:{" "}
                  <span className="font-medium text-gray-700">
                    {selectedQuestion.courseId?.nom || t("userFeedback.unknownCourse")}
                  </span>
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-semibold text-gray-700">{t("userFeedback.details.question")}</h3>
                  <p className="text-gray-800 whitespace-pre-line mt-1">{selectedQuestion.question}</p>
                </div>

                <div>
                  <h3 className="text-md font-semibold text-gray-700">{t("userFeedback.details.response")}</h3>
                  <p className="text-gray-800 whitespace-pre-line mt-1">
                    {selectedQuestion.reponse || t("userFeedback.details.noResponse")}
                  </p>
                  {selectedQuestion.reponse && (
                    <p className="text-sm text-gray-500 mt-2">
                      {t("userFeedback.details.answeredBy")}:{" "}
                      <span className="font-medium text-gray-700">
                        {selectedQuestion.courseId?.professeurId?.name || t("userFeedback.unknownUser")}
                      </span>
                    </p>
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
              <p className="text-lg">{t("userFeedback.selectQuestion")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserFeedbackPage;
