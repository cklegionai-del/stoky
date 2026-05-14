import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
  en: {
    translation: {
      "Dashboard": "Dashboard",
      // Add more English translations here
    }
  },
  fr: {
    translation: {
      "Dashboard": "Tableau de bord",
      // Add more French translations here
    }
  },
  ar: {
    translation: {
      "Dashboard": "لوحة القيادة",
      // Add more Arabic translations here
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
