import React, { useState } from 'react';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../lib/i18n/TranslationProvider';
import { Button } from './ui/button';
import type { Language } from '../lib/i18n/types';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'inline';
  showFlags?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  showFlags = true,
  className = '',
}) => {
  const { 
    t,
    currentLanguage, 
    availableLanguages, 
    changeLanguage, 
    loading, 
    error 
  } = useTranslation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentLang = availableLanguages.find((lang: Language) => lang.code === currentLanguage);

  const handleLanguageChange = async (languageCode: 'ar' | 'en') => {
    if (languageCode === currentLanguage) {
      setIsOpen(false);
      return;
    }

    setIsChanging(true);
    try {
      await changeLanguage(languageCode);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to change language:', err);
    } finally {
      setIsChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <GlobeAltIcon className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-gray-500">{t('loading')}</span>
      </div>
    );
  }

  if (error || availableLanguages.length === 0) {
    return null;
  }

  if (variant === 'inline') {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {availableLanguages.map((language: Language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            disabled={isChanging}
            className={`
              px-3 py-1 text-sm rounded-md transition-colors
              ${currentLanguage === language.code
                ? 'bg-blue-100 text-blue-800 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
              }
              ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {showFlags && (
              <span className="mr-1">{language.flag}</span>
            )}
            {language.nativeName}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className="flex items-center space-x-2"
      >
        {showFlags && currentLang && (
          <span>{currentLang.flag}</span>
        )}
        <span>{currentLang?.nativeName || currentLanguage}</span>
        <ChevronDownIcon 
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {availableLanguages.map((language: Language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  disabled={isChanging}
                  className={`
                    w-full px-4 py-2 text-left text-sm transition-colors
                    flex items-center space-x-3
                    ${currentLanguage === language.code
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                    ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {showFlags && (
                    <span className="text-lg">{language.flag}</span>
                  )}
                  <div className="flex flex-col">
                    <span>{language.nativeName}</span>
                    <span className="text-xs text-gray-500">{language.name}</span>
                  </div>
                  {currentLanguage === language.code && (
                    <div className="ml-auto">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};