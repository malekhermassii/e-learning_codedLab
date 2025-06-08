import React, { useState, useMemo, useEffect } from "react";
import SearchBar from "../components/courses/SearchBar";
import CourseCard from "../components/home/CourseCard";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourses } from "../api";
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";
import Recommendations from "../components/recommendation/Recommendations";
import { isApprenant } from "../api";
const CoursesPage = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const dispatch = useDispatch();
  const isAuth = isAuthenticated();
  const user = useSelector((state) => state.auth.userToken) || JSON.parse(localStorage.getItem("currentUser") || "{}");
  const [visibleCount, setVisibleCount] = useState(8);
  const [isStudent, setIsStudent] = useState(false);

  // Fetch allcourses
  const {
    courses = [],
    loading: loadingCourses,
    error: errorCourses,
  } = useSelector((state) => state.courses);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  // Check if the user is a student
  useEffect(() => {
    const checkIsStudent = async () => {
      const isStudent = await isApprenant(user._id);
      setIsStudent(isStudent);
    };
    checkIsStudent();
  }, [user._id]);

  // Filtrer les cours acceptés
  const acceptedCourses = courses.filter(course => course.statut === 'accepted');

  // Extraire les catégories, niveaux et langues uniques
  const categories = useMemo(() => {
    const uniqueCategories = new Set();
    acceptedCourses.forEach(course => {
      if (course.categorieId?.titre) {
        uniqueCategories.add(currentLanguage === 'ar' ? course.categorieId.titre_ar : course.categorieId.titre);
      }
    });
    return Array.from(uniqueCategories);
  }, [acceptedCourses, currentLanguage]);

  // Extraire les levels uniques
  const levels = useMemo(() => {
    const uniqueLevels = new Set();
    acceptedCourses.forEach(course => {
      if (course.level) {
        const level = currentLanguage === 'ar' ? course.level_ar : course.level;
        if (level) uniqueLevels.add(level);
      }
    });
    return Array.from(uniqueLevels).sort();
  }, [acceptedCourses, currentLanguage]);

  // Extraire les langues uniques
  const languages = useMemo(() => {
    const uniqueLanguages = new Set();
    acceptedCourses.forEach(course => {
      const courseLanguages = currentLanguage === 'ar' ? course.languages_ar : course.languages;
      if (courseLanguages) {
        // Gérer les langues comme un tableau
        const langArray = Array.isArray(courseLanguages) 
          ? courseLanguages 
          : courseLanguages.split(',').map(lang => lang.trim()).filter(Boolean);
        
        langArray.forEach(lang => {
          if (lang) uniqueLanguages.add(lang);
        });
      }
    });
    return Array.from(uniqueLanguages).sort();
  }, [acceptedCourses, currentLanguage]);

  // Filter courses based on all criteria
  const filteredCourses = useMemo(() => {
    return acceptedCourses.filter((course) => {
      const matchesSearch = !searchQuery || 
        (currentLanguage === 'ar' 
          ? course.nom_ar?.toLowerCase().includes(searchQuery.toLowerCase())
          : course.nom?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = !selectedCategory || 
        (currentLanguage === 'ar'
          ? course.categorieId?.titre_ar === selectedCategory
          : course.categorieId?.titre === selectedCategory);

      const matchesLevel = !selectedLevel || 
        (currentLanguage === 'ar'
          ? course.level_ar === selectedLevel
          : course.level === selectedLevel);

      const matchesLanguage = !selectedLanguage || (() => {
        const courseLanguages = currentLanguage === 'ar' ? course.languages_ar : course.languages;
        if (!courseLanguages) return false;
        
        // Convertir en tableau si ce n'est pas déjà le cas
        const langArray = Array.isArray(courseLanguages) 
          ? courseLanguages 
          : courseLanguages.split(',').map(lang => lang.trim());
        
        return langArray.some(lang => lang === selectedLanguage);
      })();

      return matchesSearch && matchesCategory && matchesLevel && matchesLanguage;
    });
  }, [acceptedCourses, searchQuery, selectedCategory, selectedLevel, selectedLanguage, currentLanguage]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Section with Filters */}
      <SearchBar 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        categories={categories}
        levels={levels}
        languages={languages}
      />
      {/* Link to Recommended Courses */}
      

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('courses.title')}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t('courses.description')}
          </p>
        </div>

        {/* Results Count */}
        <div className="mb-8 text-gray-600">
          {!loadingCourses && !errorCourses && (
            <p className="text-lg">
              {t('courses.results.showing')} {filteredCourses.length}{" "}
              {filteredCourses.length === 1
                ? t('courses.results.course')
                : t('courses.results.courses')}
              {searchQuery && ` ${t('courses.results.matching')} "${searchQuery}"`}
            </p>
          )}
        </div>

        {/* Courses Grid */}
        {loadingCourses && (
          <div className="text-center text-xl">{t('courses.loading')}</div>
        )}
        {errorCourses && (
          <div className="text-center text-red-500 text-xl">
            {t('courses.error')} {errorCourses}
          </div>
        )}

        {!loadingCourses && !errorCourses && filteredCourses.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredCourses.slice(0, visibleCount).map((course) => (
                <CourseCard
                  key={course._id || course.id}
                  id={course._id || course.id}
                  image={course.image}
                  nom={currentLanguage === 'ar' ? course.nom_ar : course.nom}
                  languages={currentLanguage === 'ar' ? course.languages_ar : course.languages}
                  enrolledCount={course.enrolledCount}
                  level={currentLanguage === 'ar' ? course.level_ar : course.level}
                  averageRating={course.averageRating}
                  category={currentLanguage === 'ar' ? course.categorieId?.titre_ar : course.categorieId?.titre}
                  professeur={currentLanguage === 'ar' ? course.professeurId?.specialite_ar : course.professeurId?.specialite}
                />
              ))}
            </div>
            {visibleCount < filteredCourses.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount(visibleCount + 8)}
                  className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition"
                >
                  {t('courses.seeMore', 'Voir plus')}
                </button>
              </div>
            )}
          </>
        )}

        {/* No Results Message */}
        {!loadingCourses && !errorCourses && filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600 text-xl mb-4">
              {t('courses.results.noResults')} "{searchQuery}".
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
                setSelectedLevel("");
                setSelectedLanguage("");
              }}
              className="text-[#1B45B4] hover:text-[#1B45B4]/80 font-medium"
            >
              {t('courses.filters.clearFilters')}
            </button>
          </div>
        )}

{/* RECOMMENDATIONS */}
       {isAuth && isStudent && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Recommendations />
        </div>
      )}
      </div>
    </div>
  );
};

export default CoursesPage;
