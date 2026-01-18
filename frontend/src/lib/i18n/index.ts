/**
 * Main export file for the comprehensive i18n system
 */

// Core components
export { TranslationProvider, useTranslation } from './TranslationProvider';
export { rtlManager } from './RTLManager';

// Hooks
export { useFormatting, useModelTranslation } from './hooks';

// Types
export type {
  Locale,
  Language,
  TranslationEntry,
  CacheMetadata,
  CacheInfo,
  DirectionClasses,
  TranslationManagerInterface,
  LanguageState,
  TranslationCacheInterface,
  FormattingOptions,
  ModelTranslation,
} from './types';

// RTL Manager interface
export type { RTLManager } from './RTLManager';