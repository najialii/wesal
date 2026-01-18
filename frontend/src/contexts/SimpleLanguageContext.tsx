import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface Language {
  code: string;
  name: string;
  native: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

interface LanguageContextType {
  currentLanguage: string;
  availableLanguages: Language[];
  changeLanguage: (locale: string) => Promise<void>;
  isRTL: boolean;
  loading: boolean;
  error: string | null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

const DEFAULT_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    native: 'English',
    direction: 'ltr',
    flag: '🇺🇸',
  },
  {
    code: 'ar',
    name: 'Arabic',
    native: 'العربية',
    direction: 'rtl',
    flag: '🇸🇦',
  },
];

export const SimpleLanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [availableLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const isRTL = RTL_LANGUAGES.includes(currentLanguage);

  const changeLanguage = async (locale: string) => {
    setCurrentLanguage(locale);
    localStorage.setItem('language', locale);
    
    // Update document direction
    document.documentElement.dir = RTL_LANGUAGES.includes(locale) ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  };

  const value: LanguageContextType = {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    isRTL,
    loading,
    error,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a SimpleLanguageProvider');
  }
  return context;
};