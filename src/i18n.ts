import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector/cjs';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    interpolation: {
      escapeValue: false,
    },
    debug: true,
    supportedLngs: ['en', 'it'],
    fallbackLng: 'it',
  })
  .then(() => {
    console.log('i18n initialized');
  })
  .catch((error) => {
    console.error('i18n initialization failed', error);
  });

export default i18n;
