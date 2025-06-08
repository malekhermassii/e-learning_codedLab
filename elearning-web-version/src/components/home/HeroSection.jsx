import React from "react";
import BackgroundHero from "../../assets/images/BackgroundHero.png";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const HeroSection = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Background Image - positioned to extend behind navbar */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${BackgroundHero})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          top: "-64px" /* Extend up to cover navbar height */,
          height: "calc(100% + 64px)" /* Add extra height to compensate */,
          minHeight: "100vh" /* Ensure it's at least full viewport height */,
        }}
      ></div>

      {/* Content - increased top padding from pt-32 to pt-48 */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 min-h-[calc(100vh-64px)] flex items-center">
        <div className={`text-center max-w-3xl mx-auto ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {t('hero.title')}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/90">
            {t('hero.subtitle')}
          </p>
          <div className="mt-10">
            <Link to="/subscribe">
              <button className="px-8 py-3 bg-gradient-to-r from-[#6A36FF] to-[#AC5FE6] text-white font-medium rounded-lg hover:bg-purple-700 transition duration-300 shadow-lg">
                {t('hero.subscribe_button')}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Diagonal Bottom Shape */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-white transform -skew-y-2 origin-bottom-right z-10"></div>
    </div>
  );
};

export default HeroSection;
