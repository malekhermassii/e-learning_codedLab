import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../../assets/public/translation/en';
import ar from '../../assets/public/translation/ar';
import { I18nManager } from 'react-native';

const resources = {
  en: {
    translation: en
  },
  ar: {
    translation: ar
  }
};

const i18nConfig = {
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  },
  debug: false,
  compatibilityJSON: 'v3',
  react: {
    useSuspense: false
  }
};

i18n
  .use(initReactI18next)
  .init(i18nConfig);

// Handle RTL/LTR layout
i18n.on('languageChanged', (lng) => {
  if (lng === 'ar') {
    I18nManager.forceRTL(true);
  } else {
    I18nManager.forceRTL(false);
  }
});

const switchLanguage = (lang) => {
  i18n.changeLanguage(lang);
};

export default i18n;