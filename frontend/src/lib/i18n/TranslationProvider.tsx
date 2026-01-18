/**
 * TranslationProvider - React context provider with minimal API surface
 * Optimized with lazy loading and memory management
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Locale, Language } from './types';
import { rtlManager } from './RTLManager';

interface TranslationContextType {
  currentLanguage: Locale;
  availableLanguages: Language[];
  changeLanguage: (locale: Locale) => Promise<void>;
  isRTL: boolean;
  loading: boolean;
  error: string | null;
  t: (key: string, namespace?: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
  defaultLanguage?: Locale;
}

// Lazy-loaded translation store with memory management
class TranslationCache {
  private cache = new Map<string, Record<string, Record<string, string>>>();
  private loadedNamespaces = new Set<string>();
  private maxCacheSize = 10; // Limit cache size

  private getTranslations(locale: Locale): Record<string, Record<string, string>> {
    const cacheKey = locale;
    
    if (!this.cache.has(cacheKey)) {
      // Implement cache size limit
      if (this.cache.size >= this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }
      
      // Load translations for locale
      this.cache.set(cacheKey, this.loadTranslationsForLocale(locale));
    }
    
    return this.cache.get(cacheKey)!;
  }

  private loadTranslationsForLocale(locale: Locale): Record<string, Record<string, string>> {
    // Load translations from JSON files
    try {
      const translations: Record<string, Record<string, string>> = {};
      
      // Import all translation files for the locale using dynamic imports
      const translationModules = import.meta.glob('/src/locales/*/common.json', { eager: true });
      const authModules = import.meta.glob('/src/locales/*/auth.json', { eager: true });
      const adminModules = import.meta.glob('/src/locales/*/admin.json', { eager: true });
      const dashboardModules = import.meta.glob('/src/locales/*/dashboard.json', { eager: true });
      const productsModules = import.meta.glob('/src/locales/*/products.json', { eager: true });
      const categoriesModules = import.meta.glob('/src/locales/*/categories.json', { eager: true });
      const customersModules = import.meta.glob('/src/locales/*/customers.json', { eager: true });
      const salesModules = import.meta.glob('/src/locales/*/sales.json', { eager: true });
      const staffModules = import.meta.glob('/src/locales/*/staff.json', { eager: true });
      const maintenanceModules = import.meta.glob('/src/locales/*/maintenance.json', { eager: true });
      const posModules = import.meta.glob('/src/locales/*/pos.json', { eager: true });
      const validationModules = import.meta.glob('/src/locales/*/validation.json', { eager: true });
      const settingsModules = import.meta.glob('/src/locales/*/settings.json', { eager: true });
      const technicianModules = import.meta.glob('/src/locales/*/technician.json', { eager: true });
      const branchesModules = import.meta.glob('/src/locales/*/branches.json', { eager: true });

      // Helper function to load a module
      const loadModule = (modules: Record<string, any>, namespace: string) => {
        const path = `/src/locales/${locale}/${namespace}.json`;
        if (modules[path]) {
          const module = modules[path] as any;
          translations[namespace] = module.default || module;
        }
      };

      // Load all namespaces
      loadModule(translationModules, 'common');
      loadModule(authModules, 'auth');
      loadModule(adminModules, 'admin');
      loadModule(dashboardModules, 'dashboard');
      loadModule(productsModules, 'products');
      loadModule(categoriesModules, 'categories');
      loadModule(customersModules, 'customers');
      loadModule(salesModules, 'sales');
      loadModule(staffModules, 'staff');
      loadModule(maintenanceModules, 'maintenance');
      loadModule(posModules, 'pos');
      loadModule(validationModules, 'validation');
      loadModule(settingsModules, 'settings');
      loadModule(technicianModules, 'technician');
      loadModule(branchesModules, 'branches');

      return translations;
    } catch (error) {
      console.error(`Failed to load translations for locale ${locale}:`, error);
      return {};
    }
  }

  getTranslation(locale: Locale, namespace: string, key: string): string | null {
    const translations = this.getTranslations(locale);
    
    // Handle nested keys like 'onboarding.welcome' or 'onboarding.step1.title'
    if (key.includes('.')) {
      const keys = key.split('.');
      const namespaceTranslations = translations[namespace];
      if (!namespaceTranslations) return null;
      
      // Navigate through nested object
      let current: any = namespaceTranslations;
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          return null;
        }
      }
      
      return typeof current === 'string' ? current : null;
    }
    
    return translations[namespace]?.[key] || null;
  }

  preloadNamespace(locale: Locale, namespace: string): void {
    const cacheKey = `${locale}-${namespace}`;
    if (!this.loadedNamespaces.has(cacheKey)) {
      this.getTranslations(locale);
      this.loadedNamespaces.add(cacheKey);
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.loadedNamespaces.clear();
  }
}

const translationCache = new TranslationCache();

const DEFAULT_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇺🇸',
    enabled: true,
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    flag: '🇸🇦',
    enabled: true,
  },
];

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ 
  children, 
  defaultLanguage = 'en' 
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<Locale>(() => {
    // Get language from localStorage or use default
    const stored = localStorage.getItem('i18n_language') as Locale;
    return stored && ['ar', 'en'].includes(stored) ? stored : defaultLanguage;
  });
  
  const [availableLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0); // Add version to force re-renders

  const isRTL = useMemo(() => currentLanguage === 'ar', [currentLanguage]);

  // Initialize RTL manager
  useEffect(() => {
    try {
      rtlManager.initialize(currentLanguage);
    } catch (error) {
      console.warn('RTL manager initialization failed:', error);
    }
  }, []);

  // Update RTL direction when language changes
  useEffect(() => {
    try {
      rtlManager.setDirection(currentLanguage);
      
      // Update document lang attribute for proper font application
      document.documentElement.lang = currentLanguage;
      document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    } catch (error) {
      console.warn('RTL direction update failed:', error);
      // Fallback to basic direction setting
      document.documentElement.lang = currentLanguage;
      document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    }
  }, [currentLanguage]);

  // Preload common namespaces for better performance
  useEffect(() => {
    try {
      translationCache.preloadNamespace(currentLanguage, 'common');
      translationCache.preloadNamespace(currentLanguage, 'auth');
      translationCache.preloadNamespace(currentLanguage, 'admin');
      translationCache.preloadNamespace(currentLanguage, 'customers');
      translationCache.preloadNamespace(currentLanguage, 'staff');
      translationCache.preloadNamespace(currentLanguage, 'maintenance');
      translationCache.preloadNamespace(currentLanguage, 'technician');
    } catch (error) {
      console.warn('Translation preloading failed:', error);
      setError('Failed to load translations');
    }
  }, [currentLanguage]);

  const changeLanguage = useCallback(async (locale: Locale): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Validate locale
      if (!['ar', 'en'].includes(locale)) {
        throw new Error(`Invalid locale: ${locale}. Only 'ar' and 'en' are supported.`);
      }

      // Clear translation cache before changing language
      translationCache.clearCache();

      // Store in localStorage
      localStorage.setItem('i18n_language', locale);
      
      // Update state
      setCurrentLanguage(locale);
      
      // Force re-render by incrementing version
      setVersion(prev => prev + 1);
      
      // Update RTL direction
      rtlManager.setDirection(locale);

      // Preload common namespaces for the new language
      translationCache.preloadNamespace(locale, 'common');
      translationCache.preloadNamespace(locale, 'auth');
      translationCache.preloadNamespace(locale, 'admin');
      translationCache.preloadNamespace(locale, 'customers');
      translationCache.preloadNamespace(locale, 'staff');
      translationCache.preloadNamespace(locale, 'maintenance');
      translationCache.preloadNamespace(locale, 'technician');

      // Dispatch language change event
      window.dispatchEvent(new CustomEvent('languagechange', {
        detail: { locale, isRTL: locale === 'ar' }
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change language';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const t = useCallback((key: string, namespace: string = 'common'): string => {
    try {
      const translation = translationCache.getTranslation(currentLanguage, namespace, key);
      
      if (!translation) {
        console.warn(`Translation missing: ${namespace}.${key} [${currentLanguage}]`);
        return key;
      }

      return translation;
    } catch (err) {
      console.error('Translation error:', err);
      return key;
    }
  }, [currentLanguage, version]);

  const value: TranslationContextType = useMemo(() => ({
    currentLanguage,
    availableLanguages,
    changeLanguage,
    isRTL,
    loading,
    error,
    t,
  }), [currentLanguage, availableLanguages, changeLanguage, isRTL, loading, error, t]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (namespace?: string) => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    console.warn('useTranslation must be used within a TranslationProvider. Using fallback.');
    
    // Return fallback implementation
    return {
      currentLanguage: 'en' as Locale,
      availableLanguages: DEFAULT_LANGUAGES,
      changeLanguage: async () => {},
      isRTL: false,
      loading: false,
      error: null,
      t: (key: string, options?: { fallback?: string; interpolation?: Record<string, any> }) => {
        return options?.fallback || key;
      }
    };
  }

  const t = useCallback((key: string, options?: { fallback?: string; interpolation?: Record<string, any> }) => {
    let translation = context.t(key, namespace || 'common');
    translation = translation !== key ? translation : (options?.fallback || key);
    
    // Simple interpolation
    if (options?.interpolation) {
      Object.entries(options.interpolation).forEach(([placeholder, value]) => {
        translation = translation.replace(`{{${placeholder}}}`, String(value));
      });
    }
    
    return translation;
  }, [context, namespace]);

  return {
    ...context,
    t,
  };
};

export default TranslationProvider;