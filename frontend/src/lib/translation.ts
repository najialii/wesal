/**
 * Translation compatibility layer
 * Provides hooks that components expect to import from ../lib/translation
 */

import { useTranslation as useI18nTranslation } from './i18n/TranslationProvider';
import { rtlManager } from './i18n/RTLManager';
import { useMemo } from 'react';

// Re-export the main translation hook with fallback
export const useTranslation = (namespace?: string) => {
  try {
    return useI18nTranslation(namespace);
  } catch (error) {
    console.warn('Translation provider not available, using fallback');
    
    // Fallback implementation
    const currentLanguage = 'en' as const;
    const isRTL = false;
    
    return {
      currentLanguage,
      availableLanguages: [
        { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇺🇸', enabled: true },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', flag: '🇸🇦', enabled: true }
      ],
      changeLanguage: async () => {},
      isRTL,
      loading: false,
      error: null,
      t: (key: string, options?: { fallback?: string }) => options?.fallback || key
    };
  }
};

// Hook for language preference management
export const useLanguagePreference = () => {
  try {
    const { currentLanguage, changeLanguage, availableLanguages, loading, error } = useI18nTranslation();
    return { currentLanguage, changeLanguage, availableLanguages, loading, error };
  } catch (error) {
    return {
      currentLanguage: 'en' as const,
      changeLanguage: async () => {},
      availableLanguages: [],
      loading: false,
      error: null
    };
  }
};

// Hook for RTL functionality
export const useRTL = () => {
  try {
    const { currentLanguage, isRTL } = useI18nTranslation();

    const directionClasses = useMemo(() => {
      return rtlManager.getDirectionClasses();
    }, [isRTL]);

    return {
      isRTL,
      currentLanguage,
      directionClasses,
      rtlManager,
    };
  } catch (error) {
    return {
      isRTL: false,
      currentLanguage: 'en' as const,
      directionClasses: {
        isRTL: false,
        container: 'ltr-container',
        text: 'text-left',
        margin: 'ml-4',
        padding: 'pl-4',
        border: 'border-l'
      },
      rtlManager,
    };
  }
};

// Hook for direction classes
export const useDirectionClasses = () => {
  try {
    const { isRTL } = useI18nTranslation();
    
    return useMemo(() => {
      const directionClasses = rtlManager.getDirectionClasses();
      return {
        ...directionClasses,
        isRTL,
      };
    }, [isRTL]);
  } catch (error) {
    return {
      isRTL: false,
      container: 'ltr-container',
      text: 'text-left',
      margin: 'ml-4',
      padding: 'pl-4',
      border: 'border-l'
    };
  }
};

// Export everything from the i18n system for convenience
export * from './i18n';