import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';

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

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentLanguage = i18n.language;
  const isRTL = RTL_LANGUAGES.includes(currentLanguage);

  // Language enforcement monitor
  useEffect(() => {
    const storedLanguage = localStorage.getItem('i18nextLng');
    if (storedLanguage && storedLanguage !== i18n.language) {
      console.log(`Language mismatch detected. Stored: ${storedLanguage}, Current: ${i18n.language}. Fixing...`);
      i18n.changeLanguage(storedLanguage);
    }

    // Set up a monitor to prevent language drift
    const monitor = setInterval(() => {
      const expectedLanguage = localStorage.getItem('i18nextLng') || 'en';
      if (i18n.language !== expectedLanguage) {
        console.log(`Language drift detected. Expected: ${expectedLanguage}, Current: ${i18n.language}. Correcting...`);
        i18n.changeLanguage(expectedLanguage);
      }
    }, 1000);

    return () => clearInterval(monitor);
  }, [i18n]);

  // Load available languages from API
  useEffect(() => {
    const loadAvailableLanguages = async () => {
      try {
        const response = await api.get('/languages');
        if (response.data.success) {
          setAvailableLanguages(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load available languages:', err);
        setError('Failed to load available languages');
        // Fallback to default languages
        setAvailableLanguages([
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
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadAvailableLanguages();
  }, []);

  // Load user's language preference on mount - but don't override manual selection
  useEffect(() => {
    const loadUserLanguage = async () => {
      try {
        // Only load from server if no language is set in localStorage
        const storedLanguage = localStorage.getItem('i18nextLng');
        if (storedLanguage) {
          // User has already selected a language, don't override it
          return;
        }

        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await api.get('/user/language');
          
          if (response.data.success && response.data.data.current_language) {
            await i18n.changeLanguage(response.data.data.current_language);
            localStorage.setItem('i18nextLng', response.data.data.current_language);
          }
        }
      } catch (err) {
        console.error('Failed to load user language preference:', err);
      }
    };

    loadUserLanguage();
  }, [i18n]);

  // Update document direction and class when language changes
  useEffect(() => {
    const html = document.documentElement;
    
    if (isRTL) {
      html.setAttribute('dir', 'rtl');
      html.classList.add('rtl');
      html.classList.remove('ltr');
    } else {
      html.setAttribute('dir', 'ltr');
      html.classList.add('ltr');
      html.classList.remove('rtl');
    }

    // Update lang attribute
    html.setAttribute('lang', currentLanguage);
    
    // Force a re-render by updating a CSS custom property
    html.style.setProperty('--direction', isRTL ? 'rtl' : 'ltr');
    
    // Dispatch a custom event to notify components of direction change
    window.dispatchEvent(new CustomEvent('directionchange', { 
      detail: { isRTL, currentLanguage } 
    }));
  }, [currentLanguage, isRTL]);

  const changeLanguage = async (locale: string): Promise<void> => {
    try {
      setError(null);
      
      console.log(`Changing language to: ${locale}`);
      
      // Store in localStorage first to ensure persistence
      localStorage.setItem('i18nextLng', locale);
      
      // Change language in i18next
      await i18n.changeLanguage(locale);
      
      console.log(`Language changed to: ${i18n.language}`);
      
      // Set up multiple checks to ensure language stays
      const enforceLanguage = () => {
        if (i18n.language !== locale) {
          console.log(`Language drift detected. Enforcing ${locale} (was ${i18n.language})`);
          i18n.changeLanguage(locale);
          localStorage.setItem('i18nextLng', locale);
        }
      };
      
      // Check immediately and at intervals
      setTimeout(enforceLanguage, 50);
      setTimeout(enforceLanguage, 200);
      setTimeout(enforceLanguage, 500);
      setTimeout(enforceLanguage, 1000);
      
      // Update user preference on server if authenticated
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          await api.put('/user/language', { language: locale });
        } catch (err) {
          console.error('Failed to update user language preference:', err);
          // Don't throw error here, language change should still work locally
        }
      }
      
    } catch (err) {
      console.error('Failed to change language:', err);
      setError('Failed to change language');
      throw err;
    }
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
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};