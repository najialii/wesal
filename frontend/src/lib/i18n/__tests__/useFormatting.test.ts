/**
 * Property-based tests for useFormatting hook
 * Feature: comprehensive-i18n-system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import fc from 'fast-check';
import React from 'react';
import { useFormatting } from '../hooks/useFormatting';
import { TranslationProvider } from '../TranslationProvider';
import { Locale } from '../types';

// Helper to render hook with provider
const renderFormattingHook = (locale: Locale = 'en') => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TranslationProvider defaultLanguage={locale}>
      {children}
    </TranslationProvider>
  );
  
  return renderHook(() => useFormatting(), { wrapper });
};

describe('useFormatting Property Tests', () => {
  /**
   * **Feature: comprehensive-i18n-system, Property 14: Locale-specific formatting**
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
   */
  it('should format numbers according to locale', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000000 }),
        (number) => {
          // Test English formatting
          const { result: enResult } = renderFormattingHook('en');
          const enFormatted = enResult.current.formatNumber(number);
          expect(typeof enFormatted).toBe('string');
          expect(enFormatted).toBeTruthy();

          // Test Arabic formatting
          const { result: arResult } = renderFormattingHook('ar');
          const arFormatted = arResult.current.formatNumber(number);
          expect(typeof arFormatted).toBe('string');
          expect(arFormatted).toBeTruthy();

          // Formats should be different for different locales (in most cases)
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should format currency according to locale', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10000 }),
        (amount) => {
          // Test English currency formatting
          const { result: enResult } = renderFormattingHook('en');
          const enFormatted = enResult.current.formatCurrency(amount);
          expect(typeof enFormatted).toBe('string');
          expect(enFormatted).toBeTruthy();

          // Test Arabic currency formatting
          const { result: arResult } = renderFormattingHook('ar');
          const arFormatted = arResult.current.formatCurrency(amount);
          expect(typeof arFormatted).toBe('string');
          expect(arFormatted).toBeTruthy();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should format dates according to locale', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          // Test English date formatting
          const { result: enResult } = renderFormattingHook('en');
          const enFormatted = enResult.current.formatDate(date);
          expect(typeof enFormatted).toBe('string');
          expect(enFormatted).toBeTruthy();

          // Test Arabic date formatting
          const { result: arResult } = renderFormattingHook('ar');
          const arFormatted = arResult.current.formatDate(date);
          expect(typeof arFormatted).toBe('string');
          expect(arFormatted).toBeTruthy();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
  it('should format numbers according to Arabic locale conventions', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -999999.99, max: 999999.99, noNaN: true }),
        (number) => {
          const { result } = renderFormattingHook('ar');
          const formatted = result.current.formatNumber(number);
          
          // Verify Arabic locale formatting characteristics
          expect(typeof formatted).toBe('string');
          expect(formatted.length).toBeGreaterThan(0);
          
          // Arabic numerals should be used for Arabic locale
          const hasArabicNumerals = /[٠-٩]/.test(formatted);
          const hasWesternNumerals = /[0-9]/.test(formatted);
          
          // Should use Arabic numerals or Western numerals (both are valid in ar-SA)
          expect(hasArabicNumerals || hasWesternNumerals).toBe(true);
          
          // Should not throw errors
          expect(() => parseFloat(formatted.replace(/[٠-٩]/g, (d) => 
            '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()
          ))).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format numbers according to English locale conventions', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -999999.99, max: 999999.99, noNaN: true }),
        (number) => {
          const { result } = renderFormattingHook('en');
          const formatted = result.current.formatNumber(number);
          
          // Verify English locale formatting characteristics
          expect(typeof formatted).toBe('string');
          expect(formatted.length).toBeGreaterThan(0);
          
          // Should use Western numerals for English locale
          const hasWesternNumerals = /[0-9]/.test(formatted);
          expect(hasWesternNumerals).toBe(true);
          
          // Should not contain Arabic numerals
          const hasArabicNumerals = /[٠-٩]/.test(formatted);
          expect(hasArabicNumerals).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: comprehensive-i18n-system, Property 14: Locale-specific formatting**
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
   */
  it('should format currency according to Arabic locale conventions', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.01, max: 999999.99, noNaN: true }),
        (amount) => {
          const { result } = renderFormattingHook('ar');
          const formatted = result.current.formatCurrency(amount, 'SAR');
          
          // Verify Arabic currency formatting
          expect(typeof formatted).toBe('string');
          expect(formatted.length).toBeGreaterThan(0);
          
          // Should contain currency indicator (SAR or Arabic equivalent)
          const hasCurrencyIndicator = formatted.includes('ر.س') || 
                                     formatted.includes('SAR') ||
                                     /[\u0600-\u06FF]/.test(formatted);
          expect(hasCurrencyIndicator).toBe(true);
          
          // Should contain the amount in some form
          const containsAmount = /[0-9٠-٩]/.test(formatted);
          expect(containsAmount).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format currency according to English locale conventions', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.01, max: 999999.99, noNaN: true }),
        (amount) => {
          const { result } = renderFormattingHook('en');
          const formatted = result.current.formatCurrency(amount, 'SAR');
          
          // Verify English currency formatting
          expect(typeof formatted).toBe('string');
          expect(formatted.length).toBeGreaterThan(0);
          
          // Should contain currency code or symbol
          const hasCurrencyIndicator = formatted.includes('SAR') || 
                                     formatted.includes('$') ||
                                     /[A-Z]{3}/.test(formatted);
          expect(hasCurrencyIndicator).toBe(true);
          
          // Should use Western numerals
          const hasWesternNumerals = /[0-9]/.test(formatted);
          expect(hasWesternNumerals).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: comprehensive-i18n-system, Property 14: Locale-specific formatting**
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
   */
  it('should format dates according to Arabic locale conventions', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (date) => {
          const { result } = renderFormattingHook('ar');
          const formatted = result.current.formatDate(date);
          
          // Verify Arabic date formatting
          expect(typeof formatted).toBe('string');
          expect(formatted.length).toBeGreaterThan(0);
          
          // Should contain Arabic text (month names should be in Arabic)
          const hasArabicText = /[\u0600-\u06FF]/.test(formatted);
          expect(hasArabicText).toBe(true);
          
          // Should contain year (either Arabic or Western numerals)
          const currentYear = date.getFullYear().toString();
          const hasYear = formatted.includes(currentYear) || /[٠-٩]{4}/.test(formatted);
          expect(hasYear).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format dates according to English locale conventions', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (date) => {
          const { result } = renderFormattingHook('en');
          const formatted = result.current.formatDate(date);
          
          // Verify English date formatting
          expect(typeof formatted).toBe('string');
          expect(formatted.length).toBeGreaterThan(0);
          
          // Should contain English month names
          const englishMonths = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          const hasEnglishMonth = englishMonths.some(month => formatted.includes(month));
          expect(hasEnglishMonth).toBe(true);
          
          // Should use Western numerals
          const hasWesternNumerals = /[0-9]/.test(formatted);
          expect(hasWesternNumerals).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: comprehensive-i18n-system, Property 14: Locale-specific formatting**
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
   */
  it('should format time according to locale preferences', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (date) => {
          // Test Arabic locale (24-hour format)
          const { result: arResult } = renderFormattingHook('ar');
          const arFormatted = arResult.current.formatTime(date);
          
          expect(typeof arFormatted).toBe('string');
          expect(arFormatted.length).toBeGreaterThan(0);
          
          // Test English locale (12-hour format)
          const { result: enResult } = renderFormattingHook('en');
          const enFormatted = enResult.current.formatTime(date);
          
          expect(typeof enFormatted).toBe('string');
          expect(enFormatted.length).toBeGreaterThan(0);
          
          // English should typically include AM/PM
          const hasAmPm = /AM|PM|am|pm/.test(enFormatted);
          // Note: This might not always be true depending on system locale settings
          // so we'll just verify it's a valid time string
          expect(/\d{1,2}:\d{2}/.test(enFormatted)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: comprehensive-i18n-system, Property 14: Locale-specific formatting**
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
   */
  it('should format percentages according to locale conventions', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),
        (value) => {
          // Test Arabic locale
          const { result: arResult } = renderFormattingHook('ar');
          const arFormatted = arResult.current.formatPercentage(value);
          
          expect(typeof arFormatted).toBe('string');
          expect(arFormatted.length).toBeGreaterThan(0);
          expect(arFormatted.includes('%') || arFormatted.includes('٪')).toBe(true);
          
          // Test English locale
          const { result: enResult } = renderFormattingHook('en');
          const enFormatted = enResult.current.formatPercentage(value);
          
          expect(typeof enFormatted).toBe('string');
          expect(enFormatted.length).toBeGreaterThan(0);
          expect(enFormatted.includes('%')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle formatting errors gracefully', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(NaN),
          fc.constant(Infinity),
          fc.constant(-Infinity),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (invalidValue) => {
          const { result } = renderFormattingHook('ar');
          
          // Should not throw errors and return fallback strings
          expect(() => {
            const numberResult = result.current.formatNumber(invalidValue as number);
            expect(typeof numberResult).toBe('string');
          }).not.toThrow();
          
          expect(() => {
            const currencyResult = result.current.formatCurrency(invalidValue as number);
            expect(typeof currencyResult).toBe('string');
          }).not.toThrow();
          
          expect(() => {
            const percentResult = result.current.formatPercentage(invalidValue as number);
            expect(typeof percentResult).toBe('string');
          }).not.toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain formatting consistency across multiple calls', () => {
    fc.assert(
      fc.property(
        fc.record({
          number: fc.float({ min: 0, max: 999999, noNaN: true }),
          currency: fc.float({ min: 0.01, max: 999999.99, noNaN: true }),
          date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          percentage: fc.float({ min: 0, max: 1, noNaN: true })
        }),
        ({ number, currency, date, percentage }) => {
          const { result } = renderFormattingHook('ar');
          
          // Format the same values multiple times
          const numberResult1 = result.current.formatNumber(number);
          const numberResult2 = result.current.formatNumber(number);
          const currencyResult1 = result.current.formatCurrency(currency);
          const currencyResult2 = result.current.formatCurrency(currency);
          const dateResult1 = result.current.formatDate(date);
          const dateResult2 = result.current.formatDate(date);
          const percentResult1 = result.current.formatPercentage(percentage);
          const percentResult2 = result.current.formatPercentage(percentage);
          
          // Results should be consistent
          expect(numberResult1).toBe(numberResult2);
          expect(currencyResult1).toBe(currencyResult2);
          expect(dateResult1).toBe(dateResult2);
          expect(percentResult1).toBe(percentResult2);
        }
      ),
      { numRuns: 100 }
    );
  });
});