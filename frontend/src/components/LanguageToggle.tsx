import React from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useLanguagePreference } from '../lib/translation';
import { Button } from './ui/button';

interface LanguageToggleProps {
  variant?: 'button' | 'icon';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  variant = 'button',
  size = 'sm',
  className = '',
}) => {
  const { currentLanguage, changeLanguage, loading } = useLanguagePreference();

  const handleToggle = async () => {
    const newLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    try {
      await changeLanguage(newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const getLanguageLabel = () => {
    return currentLanguage === 'en' ? 'العربية' : 'English';
  };

  const getLanguageFlag = () => {
    return currentLanguage === 'en' ? '🇸🇦' : '🇺🇸';
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={loading}
        className={`relative ${className}`}
        title={`Switch to ${getLanguageLabel()}`}
      >
        <GlobeAltIcon className="h-4 w-4" />
        <span className="absolute -top-1 -right-1 text-xs">
          {getLanguageFlag()}
        </span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center space-x-2 ${className}`}
    >
      <span>{getLanguageFlag()}</span>
      <span>{getLanguageLabel()}</span>
      {loading && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
      )}
    </Button>
  );
};