import i18nConfig from '../src/i18n/i18n';

// ... (code omitted for brevity, but I will replace the whole file since it's short or use multi_replace)
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { changeLanguage as i18nChangeLanguage } from '../src/i18n/i18n';
import { useTranslation } from 'react-i18next';

export type Language = 'en' | 'hi' | 'ar';

const LANGUAGE_KEY = '@app_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      try {
        const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (storedLang && (storedLang === 'en' || storedLang === 'hi' || storedLang === 'ar')) {
          setLanguageState(storedLang as Language);
          await i18nChangeLanguage(storedLang);
        }
      } catch (e) {
        console.error('Failed to load language', e);
      }
    })();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguageState(lang);
      await i18nChangeLanguage(lang);
    } catch (e) {
      console.error('Failed to save language', e);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
