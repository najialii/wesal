/**
 * Type definitions for the comprehensive i18n system
 */

export type Locale = 'ar' | 'en';

export interface Language {
  code: Locale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
  enabled: boolean;
}

export interface TranslationEntry {
  key: string;
  value: string;
  namespace: string;
  locale: Locale;
  version: string;
  lastUpdated: Date;
}

export interface CacheMetadata {
  locale: Locale;
  namespace: string;
  version: string;
  size: number;
  lastAccessed: Date;
  expiresAt: Date;
}

export interface CacheInfo {
  totalSize: number;
  totalEntries: number;
  locales: Locale[];
  namespaces: string[];
  metadata: CacheMetadata[];
}

export interface DirectionClasses {
  isRTL: boolean;
  container: string;
  text: string;
  margin: string;
  padding: string;
  border: string;
}

export interface TranslationManagerInterface {
  // Core translation methods
  translate(key: string, namespace?: string): string;
  changeLanguage(locale: Locale): Promise<void>;
  loadNamespace(namespace: string): Promise<void>;
  
  // State management
  getCurrentLanguage(): Locale;
  getAvailableLanguages(): Language[];
  isLanguageLoaded(locale: Locale): boolean;
  
  // Cache management
  preloadTranslations(locales: Locale[]): Promise<void>;
  clearCache(): Promise<void>;
  syncWithServer(): Promise<void>;
}

export interface LanguageState {
  currentLanguage: Locale;
  availableLanguages: Language[];
  loadedNamespaces: Set<string>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setLanguage: (locale: Locale) => void;
  setAvailableLanguages: (languages: Language[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addLoadedNamespace: (namespace: string) => void;
}

export interface TranslationCacheInterface {
  // Storage operations
  store(locale: Locale, namespace: string, translations: Record<string, string>): Promise<void>;
  retrieve(locale: Locale, namespace: string): Promise<Record<string, string> | null>;
  
  // Cache management
  clear(): Promise<void>;
  clearLocale(locale: Locale): Promise<void>;
  getStorageInfo(): Promise<CacheInfo>;
  
  // Versioning
  setVersion(locale: Locale, namespace: string, version: string): Promise<void>;
  getVersion(locale: Locale, namespace: string): Promise<string | null>;
}

export interface FormattingOptions {
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

export interface ModelTranslation {
  id: number;
  modelType: string;
  modelId: number;
  fieldName: string;
  locale: Locale;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}