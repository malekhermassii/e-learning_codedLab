import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCategories } from "../../redux/slices/categorieSlice";
import { useTranslation } from "react-i18next";
import axios from 'axios';

// Arrow icons for carousel navigation
const LeftArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const RightArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const CategorySection = () => {
  const carouselRef = useRef(null);
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.categories.categories);
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language; // Obtenir la langue actuelle

  // Auto-save to localStorage
  useEffect(() => {
    const savecategoriesToStorage = async () => {
      try {
        await localStorage.setItem("categories", JSON.stringify(categories));
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des categories:", error);
      }
    };

    if (categories.length > 0) {
      // Sauvegarde uniquement si les categories existent
      savecategoriesToStorage();
    }
  }, [categories]);

  // fetch categories
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await axios.get('https://backendlms-5992.onrender.com/categorie', 
          {withCredentials: false},
        {
          headers: { 'Content-Type': 'application/json' }
        });
        dispatch(setCategories(response.data));
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données stockées:",
          error
        );
      }
    };

    loadInitialData();
  }, [dispatch]);

  // Fonction de défilement vers la gauche (version simplifiée)
  const handleLeftClick = () => {
    if (carouselRef.current) {
      const itemWidth = 110; // Largeur d'un élément
      const spaceX = 24; // space-x-6 = 1.5rem = 24px
      const scrollAmount = (itemWidth + spaceX) * 3; // Défile de 3 éléments
      carouselRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  // Fonction de défilement vers la droite (version simplifiée)
  const handleRightClick = () => {
    if (carouselRef.current) {
      const itemWidth = 110; // Largeur d'un élément
      const spaceX = 24; // space-x-6 = 1.5rem = 24px
      const scrollAmount = (itemWidth + spaceX) * 3; // Défile de 3 éléments
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (categories.length === 0) {
    return (
      <section className="py-2 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-6">
            {t('categories.explore_categories')}
          </h2>
          <div className="flex justify-center">
            <div className="animate-pulse rounded-md bg-gray-200 h-32 w-full max-w-4xl">
              <span className="sr-only">{t('categories.loading')}</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-2 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-blue-900 mb-6">
          {t('categories.explore_categories')}
        </h2>

        <div className="relative max-w-4xl mx-auto">
          {/* Left Arrow */}
          <button
            onClick={handleLeftClick}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 focus:outline-none"
            aria-label={t('categories.scroll_left')}
            style={{ left: "-16px" }}
          >
            <LeftArrowIcon />
          </button>

          {/* Carousel Container */}
          <div className="overflow-hidden mx-10">
            <div
              ref={carouselRef}
              className="flex space-x-6 py-4"
              style={{
                scrollBehavior: "smooth",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",  /* Firefox */
                msOverflowStyle: "none",  /* Internet Explorer/Edge */
              }}
            >
              {/* Masquer la barre de défilement pour Chrome et Safari */}
              <style jsx="true">{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="flex-shrink-0 flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
                  style={{ width: "110px", minWidth: "110px" }}
                >
                  <div className="text-blue-600 mb-3">
                    <img
                      src={`https://backendlms-5992.onrender.com/Public/Images/${category.image}`}
                      alt={category.titre}
                      className="h-16 w-16 object-cover rounded-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/64?text=?";
                      }}
                    />
                  </div>
                  <h3 className="text-xs font-medium text-gray-900 text-center">
                    {currentLanguage === 'ar' ? category.titre_ar : category.titre}
                  </h3>
                </div>
              ))}
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleRightClick}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 focus:outline-none"
            aria-label={t('categories.scroll_right')}
            style={{ right: "-16px" }}
          >
            <RightArrowIcon />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
