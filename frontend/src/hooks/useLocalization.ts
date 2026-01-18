import { useLanguage } from '../contexts/SimpleLanguageContext';

/**
 * Enhanced translation hook with namespace support
 */
export const useTranslation = () => {
  const { changeLanguage, currentLanguage } = useLanguage();

  // Simple translation function that just returns the key for now
  const t = (key: string, fallback?: string) => {
    return fallback || key;
  };

  return {
    t,
    changeLanguage,
    currentLanguage,
  };
};

/**
 * Hook for RTL language detection
 */
export const useRTL = () => {
  const { isRTL } = useLanguage();
  return isRTL;
};

/**
 * Hook for language preference management
 */
export const useLanguagePreference = () => {
  const { 
    currentLanguage, 
    availableLanguages, 
    changeLanguage, 
    loading, 
    error 
  } = useLanguage();

  return {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    loading,
    error,
  };
};

/**
 * Hook for direction-aware CSS classes
 */
export const useDirectionClasses = () => {
  const isRTL = useRTL();
  
  return {
    isRTL,
    directionClass: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'text-right' : 'text-left',
    marginStart: isRTL ? 'mr' : 'ml',
    marginEnd: isRTL ? 'ml' : 'mr',
    paddingStart: isRTL ? 'pr' : 'pl',
    paddingEnd: isRTL ? 'pl' : 'pr',
    borderStart: isRTL ? 'border-r' : 'border-l',
    borderEnd: isRTL ? 'border-l' : 'border-r',
    roundedStart: isRTL ? 'rounded-r' : 'rounded-l',
    roundedEnd: isRTL ? 'rounded-l' : 'rounded-r',
    // Flex utilities
    flexDirection: isRTL ? 'flex-row-reverse' : 'flex-row',
    justifyStart: isRTL ? 'justify-end' : 'justify-start',
    justifyEnd: isRTL ? 'justify-start' : 'justify-end',
    itemsStart: isRTL ? 'items-end' : 'items-start',
    itemsEnd: isRTL ? 'items-start' : 'items-end',
    // Position utilities
    left: isRTL ? 'right' : 'left',
    right: isRTL ? 'left' : 'right',
    // Space utilities
    spaceX: (size: string) => isRTL ? `space-x-reverse space-x-${size}` : `space-x-${size}`,
  };
};

/**
 * Hook for locale-aware number formatting
 */
export const useNumberFormat = () => {
  const { currentLanguage } = useLanguage();
  
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(currentLanguage, options).format(number);
  };

  const formatCurrency = (amount: number, currency = 'SAR') => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return {
    formatNumber,
    formatCurrency,
    formatPercent,
  };
};

/**
 * Hook for locale-aware date formatting
 */
export const useDateFormat = () => {
  const { currentLanguage } = useLanguage();
  
  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(currentLanguage, options).format(dateObj);
  };

  const formatDateTime = (date: Date | string) => {
    return formatDate(date, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (date: Date | string) => {
    return formatDate(date, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    const rtf = new Intl.RelativeTimeFormat(currentLanguage, { numeric: 'auto' });
    
    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    }
  };

  return {
    formatDate,
    formatDateTime,
    formatTime,
    formatRelativeTime,
  };
};