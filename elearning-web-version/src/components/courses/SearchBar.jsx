import React from 'react';
import { useTranslation } from 'react-i18next';

const SearchBar = ({ 
  searchQuery, 
  onSearchChange, 
  selectedCategory,
  setSelectedCategory,
  selectedLevel,
  setSelectedLevel,
  selectedLanguage,
  setSelectedLanguage,
  categories,
  levels,
  languages
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-[#1B45B4] mt-20 pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-8">
          {t('courses.search.title')}
        </h2>
        <div className="relative mb-6">
          <input
            type="text"
            placeholder={t('courses.search.placeholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white pr-32 text-lg"
          />
          <button 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-blue-600 px-6 py-2.5 rounded-full hover:bg-blue-50 transition-colors font-medium"
          >
            {t('courses.search.button')}
          </button>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 pl-4 pr-10 border border-white/20 rounded-lg bg-white/10 text-white focus:text-black focus:outline-none focus:border-white appearance-none"
            >
              <option value="">{t('courses.filters.allCategories')}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Level Filter */}
          <div className="relative">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full p-3 pl-4 pr-10 border border-white/20 rounded-lg bg-white/10 text-white focus:text-black focus:outline-none focus:border-white appearance-none"
            >
              <option value="">{t('courses.filters.allLevels')}</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Language Filter */}
          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full p-3 pl-4 pr-10 border border-white/20 rounded-lg bg-white/10 text-white focus:text-black focus:outline-none focus:border-white appearance-none"
            >
              <option value="">{t('courses.filters.allLanguages')}</option>
              {languages.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar; 