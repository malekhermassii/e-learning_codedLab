import { useTranslation } from "react-i18next";
import enFlag from "../../assets/images/en.png";
import arFlag from "../../assets/images/ar.png";

const LanguageSwitcher = ({ isHomePage }) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center ${isHomePage ? "text-white" : "text-black"
        } hover:text-blue-300`}
    >
      <span className="mr-1">
        <img
          src={i18n.language === 'en' ? enFlag : arFlag}
          alt={i18n.language === 'en' ? "English" : "Arabic"}
          className="h-5 w-5"
        />
      </span>
    </button>
  );
};

export default LanguageSwitcher; 