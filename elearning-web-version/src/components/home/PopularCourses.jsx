import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourses } from '../../api'; // Assurez-vous que le chemin est correct
import CourseCard from './CourseCard';
import { useTranslation } from 'react-i18next';

const PopularCourses = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language; // Obtenir la langue actuelle
  
  const { 
    courses = [], // Fournir un tableau vide par défaut
    loading,
    error 
  } = useSelector((state) => state.courses);

  // fetch courses
  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  // Filtrer les cours acceptés
  const acceptedCourses = courses.filter(course => course.statut === 'accepted');

  // *** LOGGING: Inspecter la structure du premier cours ***

  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-blue-900">{t('popularCourses.title')}</h2>
        <Link to="/courses" className="text-blue-600 hover:text-blue-800">
          {t('popularCourses.seeAll')}
        </Link>
      </div>
      {loading && <div className="text-center">{t('popularCourses.loading')}</div>}
      {error && <div className="text-center text-red-600">{t('popularCourses.error')} {error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {acceptedCourses.slice(0, 8).map((course) => (
            <CourseCard 
              // *** Utiliser _id en priorité car c'est le plus probable ***
              key={course._id || course.id} // Clé unique
              id={course._id || course.id}    // Passer l'ID correct à CourseCard
              image={course.image}
              nom={currentLanguage === 'ar' ? course.nom_ar : course.nom}
              languages={course.languages}
              enrolledCount={course.enrolledCount}
              level={course.level}
              averageRating={course.averageRating}
              category={currentLanguage === 'ar' ? course.categorieId?.titre_ar : course.categorieId?.titre || 'Non catégorisé'}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default PopularCourses;
