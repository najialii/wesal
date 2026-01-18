/**
 * Hook for backend model content translation
 */

import { useState, useCallback } from 'react';
import { useTranslation } from '../TranslationProvider';
import type { Locale, ModelTranslation } from '../types';

interface ModelTranslationHookReturn {
  translateModel: <T extends Record<string, any>>(
    model: T,
    field: keyof T,
    locale?: Locale
  ) => string;
  setModelTranslation: (
    modelType: string,
    modelId: number,
    field: string,
    locale: Locale,
    value: string
  ) => Promise<void>;
  getModelTranslations: (
    modelType: string,
    modelId: number
  ) => Promise<Record<string, Record<Locale, string>>>;
  loading: boolean;
  error: string | null;
}

export const useModelTranslation = (): ModelTranslationHookReturn => {
  const { currentLanguage } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateModel = useCallback(<T extends Record<string, any>>(
    model: T,
    field: keyof T,
    locale?: Locale
  ): string => {
    const targetLocale = locale || currentLanguage;
    
    try {
      // Check if model has translations property
      if (model.translations && Array.isArray(model.translations)) {
        const translation = model.translations.find((t: ModelTranslation) => 
          t.fieldName === field && t.locale === targetLocale
        );
        
        if (translation) {
          return translation.value;
        }
      }

      // Check if model has direct translation methods
      if (typeof model.getTranslation === 'function') {
        const translation = model.getTranslation(field as string, targetLocale);
        if (translation) {
          return translation;
        }
      }

      // Fallback to original field value
      const originalValue = model[field];
      return originalValue ? String(originalValue) : '';
    } catch (err) {
      console.error('Model translation error:', err);
      return model[field] ? String(model[field]) : '';
    }
  }, [currentLanguage]);

  const setModelTranslation = useCallback(async (
    modelType: string,
    modelId: number,
    field: string,
    locale: Locale,
    value: string
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Validate inputs
      if (!['ar', 'en'].includes(locale)) {
        throw new Error(`Invalid locale: ${locale}. Only 'ar' and 'en' are supported.`);
      }

      if (!modelType || !modelId || !field || !value) {
        throw new Error('All parameters are required for setting model translation');
      }

      // Make API call to store translation
      const response = await fetch('/api/model-translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          model_type: modelType,
          model_id: modelId,
          field_name: field,
          locale: locale,
          value: value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to store translation');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set model translation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getModelTranslations = useCallback(async (
    modelType: string,
    modelId: number
  ): Promise<Record<string, Record<Locale, string>>> => {
    try {
      setLoading(true);
      setError(null);

      if (!modelType || !modelId) {
        throw new Error('Model type and ID are required');
      }

      const response = await fetch(`/api/model-translations/${modelType}/${modelId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch translations');
      }

      return result.data || {};

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get model translations';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    translateModel,
    setModelTranslation,
    getModelTranslations,
    loading,
    error,
  };
};

export default useModelTranslation;