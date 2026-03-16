import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import storage from '../utils/storage';

import en from './locales/en.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';

const LANGUAGE_KEY = '@app_language';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
];

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  hi: { translation: hi },
};

export const initI18n = async () => {
  // Try to load saved preference
  let savedLang: string | null = null;
  try {
    savedLang = await storage.getItem(LANGUAGE_KEY);
  } catch {
    // ignore
  }

  // Fallback to device locale if available
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
  const defaultLang =
    savedLang ?? (Object.keys(resources).includes(deviceLocale) ? deviceLocale : 'en');

  await i18n.use(initReactI18next).init({
    resources,
    lng: defaultLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });
};

export const changeLanguage = async (langCode: string) => {
  await i18n.changeLanguage(langCode);
  await storage.setItem(LANGUAGE_KEY, langCode);
};

export default i18n;
