import { useState } from 'react';
import { useLanguagePreference } from '../lib/translation';
import { Button } from './ui/button';

interface SimpleLanguageToggleProps {
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'lg' | 'default';
}

export function SimpleLanguageToggle({ size = 'default' }: SimpleLanguageToggleProps) {
  const { currentLanguage, changeLanguage, loading } = useLanguagePreference();
  const [isChanging, setIsChanging] = useState(false);

  const handleToggle = async () => {
    const newLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    setIsChanging(true);
    try {
      await changeLanguage(newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const buttonText = currentLanguage === 'en' ? 'العربية' : 'English';
  const isLoading = loading || isChanging;

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className="min-w-[80px]"
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
          <span>{buttonText}</span>
        </div>
      ) : (
        buttonText
      )}
    </Button>
  );
}