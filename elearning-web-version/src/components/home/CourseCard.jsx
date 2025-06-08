import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import scoreIcon from "../../assets/images/Score.svg";
import { useTranslation } from "react-i18next";

const CourseCard = ({
  id,
  image,
  nom,
  languages,
  enrolledCount,
  level,
  averageRating,
  category,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleStartCourse = () => {
    navigate(`/courses/${id}`);
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <img
        src={`http://192.168.70.148:4000/Public/Images/${image}`}
        alt={nom}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <h3 className="text-2xl font-semibold text-blue-900 mb-3 z-10 truncate">
          {nom}
        </h3>
        <h4 className="text-lg text-[#e6913c] line-clamp-2 min-h-[36px]">
          {category}
        </h4>

        <div className="flex flex-wrap flex-col gap-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100">
              <svg
                className="w-3 h-3 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <span className="font-medium">{t('popularCourses.courseCard.languages')}: {languages}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100">
              <svg
                className="w-3 h-3 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span className="font-medium">{t('popularCourses.courseCard.students')}: {enrolledCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100">
              <svg
                className="w-3 h-3 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="font-medium">{t('popularCourses.courseCard.level')}: {level}</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <button
            onClick={handleStartCourse}
            className="flex items-center bg-[#3f51b5] text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
          >
            {t('popularCourses.courseCard.startCourse')}
          </button>
          <div className="relative w-10 h-10">
            <img src={scoreIcon} alt="Score" className="w-full h-full" />
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-900 font-semibold">
              {averageRating}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

//valider les types des propriétés (props)
CourseCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  image: PropTypes.string.isRequired,
  nom: PropTypes.string.isRequired,
  languages: PropTypes.string.isRequired,
  enrolledCount: PropTypes.number.isRequired,
  level: PropTypes.string.isRequired,
  averageRating: PropTypes.number.isRequired,
};

export default CourseCard;
