/**
 * Specialized hooks for Arabic/English formatting (numbers, dates, currency)
 */

import { useTranslation } from '../TranslationProvider';
import type { FormattingOptions } from '../types';

export const useFormatting = () => {
  const { currentLanguage } = useTranslation();

  const formatNumber = (
    value: number,
    options: FormattingOptions = {}
  ): string => {
    try {
      const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
      
      const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: options.minimumFractionDigits,
        maximumFractionDigits: options.maximumFractionDigits,
        useGrouping: options.useGrouping !== false,
      });

      return formatter.format(value);
    } catch (error) {
      console.error('Number formatting error:', error);
      return value.toString();
    }
  };

  const formatCurrency = (
    value: number,
    currency: string = 'SAR',
    options: FormattingOptions = {}
  ): string => {
    try {
      const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
      
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: options.minimumFractionDigits ?? 2,
        maximumFractionDigits: options.maximumFractionDigits ?? 2,
        useGrouping: options.useGrouping !== false,
      });

      return formatter.format(value);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return `${value} ${currency}`;
    }
  };

  const formatDate = (
    date: Date | string | number,
    options: Intl.DateTimeFormatOptions = {}
  ): string => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }

      const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
      
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
      };

      const formatter = new Intl.DateTimeFormat(locale, defaultOptions);
      return formatter.format(dateObj);
    } catch (error) {
      console.error('Date formatting error:', error);
      return new Date(date).toLocaleDateString();
    }
  };

  const formatTime = (
    date: Date | string | number,
    options: Intl.DateTimeFormatOptions = {}
  ): string => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }

      const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
      
      const defaultOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: currentLanguage === 'en', // 12-hour for English, 24-hour for Arabic
        ...options,
      };

      const formatter = new Intl.DateTimeFormat(locale, defaultOptions);
      return formatter.format(dateObj);
    } catch (error) {
      console.error('Time formatting error:', error);
      return new Date(date).toLocaleTimeString();
    }
  };

  const formatDateTime = (
    date: Date | string | number,
    dateOptions: Intl.DateTimeFormatOptions = {},
    timeOptions: Intl.DateTimeFormatOptions = {}
  ): string => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }

      const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
      
      const combinedOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: currentLanguage === 'en',
        ...dateOptions,
        ...timeOptions,
      };

      const formatter = new Intl.DateTimeFormat(locale, combinedOptions);
      return formatter.format(dateObj);
    } catch (error) {
      console.error('DateTime formatting error:', error);
      return new Date(date).toLocaleString();
    }
  };

  const formatPercentage = (
    value: number,
    options: FormattingOptions = {}
  ): string => {
    try {
      const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
      
      const formatter = new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: options.minimumFractionDigits ?? 1,
        maximumFractionDigits: options.maximumFractionDigits ?? 2,
        useGrouping: options.useGrouping !== false,
      });

      return formatter.format(value);
    } catch (error) {
      console.error('Percentage formatting error:', error);
      return `${(value * 100).toFixed(2)}%`;
    }
  };

  const formatRelativeTime = (
    date: Date | string | number,
    options: Intl.RelativeTimeFormatOptions = {}
  ): string => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }

      const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
      const now = new Date();
      const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);

      const formatter = new Intl.RelativeTimeFormat(locale, {
        numeric: 'auto',
        style: 'long',
        ...options,
      });

      // Determine the appropriate unit
      const absDiff = Math.abs(diffInSeconds);
      
      if (absDiff < 60) {
        return formatter.format(diffInSeconds, 'second');
      } else if (absDiff < 3600) {
        return formatter.format(Math.floor(diffInSeconds / 60), 'minute');
      } else if (absDiff < 86400) {
        return formatter.format(Math.floor(diffInSeconds / 3600), 'hour');
      } else if (absDiff < 2592000) {
        return formatter.format(Math.floor(diffInSeconds / 86400), 'day');
      } else if (absDiff < 31536000) {
        return formatter.format(Math.floor(diffInSeconds / 2592000), 'month');
      } else {
        return formatter.format(Math.floor(diffInSeconds / 31536000), 'year');
      }
    } catch (error) {
      console.error('Relative time formatting error:', error);
      return new Date(date).toLocaleDateString();
    }
  };

  const formatFileSize = (bytes: number): string => {
    try {
      const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
      const units = currentLanguage === 'ar' 
        ? ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت']
        : ['B', 'KB', 'MB', 'GB', 'TB'];

      if (bytes === 0) return `0 ${units[0]}`;

      const k = 1024;
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      const size = bytes / Math.pow(k, i);

      const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: i === 0 ? 0 : 1,
      });

      return `${formatter.format(size)} ${units[i]}`;
    } catch (error) {
      console.error('File size formatting error:', error);
      return `${bytes} bytes`;
    }
  };

  return {
    formatNumber,
    formatCurrency,
    formatDate,
    formatTime,
    formatDateTime,
    formatPercentage,
    formatRelativeTime,
    formatFileSize,
    currentLanguage,
    isRTL: currentLanguage === 'ar',
  };
};

export default useFormatting;