import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Translation data
const translations = {
  en: {
    'navigation.dashboard': 'Dashboard',
    'auth.logout': 'Log out',
    'title': 'Products',
  },
  ar: {
    'navigation.dashboard': 'لوحة التحكم',
    'auth.logout': 'تسجيل الخروج',
    'title': 'المنتجات',
  }
};

// RTL languages
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

interface TranslationContextType {
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
  t: (key: string, options?: { fallback?: string }) => string;
  isRTL: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function SimpleTranslationProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const isRTL = RTL_LANGUAGES.includes(currentLanguage);

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLanguage);
    
    if (isRTL) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
  }, [currentLanguage, isRTL]);

  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, options?: { fallback?: string }) => {
    const langTranslations = translations[currentLanguage as keyof typeof translations];
    const translation = langTranslations?.[key as keyof typeof langTranslations];
    return translation || options?.fallback || key;
  };

  return (
    <TranslationContext.Provider value={{ currentLanguage, changeLanguage, t, isRTL }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useSimpleTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useSimpleTranslation must be used within SimpleTranslationProvider');
  }
  return context;
}

export function useDirectionClasses() {
  const { isRTL } = useSimpleTranslation();
  
  return {
    isRTL,
    directionClass: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'text-right' : 'text-left',
  };
}

export function useTranslation(_namespace?: string) {
  const { t, currentLanguage, changeLanguage } = useSimpleTranslation();
  
  return {
    t: (key: string, options?: { fallback?: string }) => t(key, options),
    currentLanguage,
    changeLanguage,
  };
}

export function useRTL() {
  const { isRTL } = useSimpleTranslation();
  return { isRTL };
}

// Default export for easier importing
export default {
  useSimpleTranslation,
  useDirectionClasses,
  useTranslation,
  useRTL,
  SimpleTranslationProvider
};