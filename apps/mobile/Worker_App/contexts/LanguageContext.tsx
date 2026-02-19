import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'hi' | 'ar';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  en: {
    dashboard: 'Dashboard',
    profile: 'Profile',
    settings: 'Settings',
    language: 'Language',
    logout: 'Logout',
    logout_confirm: 'Are you sure you want to exit?',
    cancel: 'Cancel',
    email: 'Email Address',
    phone: 'Phone Number',
    work_id: 'Work ID',
    dark_mode: 'Dark Mode',
    light_mode: 'Light Mode',
    appearance: 'Appearance',
    notifications: 'Notifications',
    device_info: 'Device Info',
    account_details: 'Account Details',
    welcome_back: 'Welcome Back',
    sign_in_subtitle: 'Sign in to your worker account',
    remember_me: 'Remember Me',
    forgot_password: 'Forgot Password?',
    sign_in: 'Sign In',
    jobs_done: 'Jobs Done',
    total_revenue: 'Total Revenue',
    supervisor: 'Supervisor',
    location: 'Location',
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    logout: 'लॉग आउट',
    logout_confirm: 'क्या आप निश्चित रूप से बाहर निकलना चाहते हैं?',
    cancel: 'रद्द करें',
    email: 'ईमेल पता',
    phone: 'फ़ोन नंबर',
    work_id: 'कार्य आईडी',
    dark_mode: 'डार्क मोड',
    light_mode: 'लाइट मोड',
    appearance: 'दिखावट',
    notifications: 'सूचनाएं',
    device_info: 'डिवाइस की जानकारी',
    account_details: 'खाता विवरण',
    welcome_back: 'वापसी पर स्वागत है',
    sign_in_subtitle: 'अपने वर्कर खाते में साइन इन करें',
    remember_me: 'मुझे याद रखें',
    forgot_password: 'पासवर्ड भूल गए?',
    sign_in: 'साइन इन करें',
    jobs_done: 'नौकरियां पूरी कीं',
    total_revenue: 'कुल राजस्व',
    supervisor: 'पर्यवेक्षक',
    location: 'स्थान',
  },
  ar: {
    dashboard: 'لوحة القيادة',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    language: 'اللغة',
    logout: 'تسجيل الخروج',
    logout_confirm: 'هل أنت متأكد أنك تريد الخروج؟',
    cancel: 'إلغاء',
    email: 'عنوان البريد الإلكتروني',
    phone: 'رقم الهاتف',
    work_id: 'معرف العمل',
    dark_mode: 'الوضع الداكن',
    light_mode: 'الوضع الفاتح',
    appearance: 'المظهر',
    notifications: 'الإشعارات',
    device_info: 'معلومات الجهاز',
    account_details: 'تفاصيل الحساب',
    welcome_back: 'مرحبًا بعودتك',
    sign_in_subtitle: 'تسجيل الدخول إلى حساب العامل الخاص بك',
    remember_me: 'تذكرني',
    forgot_password: 'هل نسيت كلمة المرور؟',
    sign_in: 'تسجيل الدخول',
    jobs_done: 'الوظائف المنجزة',
    total_revenue: 'إجمالي الإيرادات',
    supervisor: 'مشرف',
    location: 'موقع',
  },
};

const LANGUAGE_KEY = '@app_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    (async () => {
      try {
        const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (storedLang && (storedLang === 'en' || storedLang === 'hi' || storedLang === 'ar')) {
          setLanguageState(storedLang as Language);
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
    } catch (e) {
      console.error('Failed to save language', e);
    }
  };

  const t = (key: string) => {
    return translations[language][key] || key;
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
