/**
 * Property-based tests for RTLManager
 * Feature: comprehensive-i18n-system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { rtlManager } from '../RTLManager';

describe('RTLManager Property Tests', () => {
  let originalHTML: HTMLHtmlElement;
  let originalBody: HTMLBodyElement;

  beforeEach(() => {
    // Save original state
    originalHTML = document.documentElement;
    originalBody = document.body;
    
    // Reset DOM state
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.className = '';
    document.body.className = '';
  });

  afterEach(() => {
    // Restore original state
    document.documentElement.setAttribute('dir', originalHTML.getAttribute('dir') || 'ltr');
    document.documentElement.setAttribute('lang', originalHTML.getAttribute('lang') || 'en');
    document.documentElement.className = originalHTML.className;
    document.body.className = originalBody.className;
  });

  /**
   * **Feature: comprehensive-i18n-system, Property 9: Bidirectional text handling**
   * **Validates: Requirements 5.3**
   */
  it('should handle bidirectional text correctly for mixed Arabic/English content', () => {
    fc.assert(
      fc.property(
        fc.record({
          arabicText: fc.stringOf(fc.char().filter(c => c >= '\u0600' && c <= '\u06FF'), { minLength: 1, maxLength: 20 }),
          englishText: fc.stringOf(fc.char().filter(c => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')), { minLength: 1, maxLength: 20 }),
          separator: fc.constantFrom(' ', '-', '_', '.')
        }),
        ({ arabicText, englishText, separator }) => {
          // Create mixed content
          const mixedContent = `${arabicText}${separator}${englishText}`;
          
          // Create test element
          const element = document.createElement('div');
          element.textContent = mixedContent;
          document.body.appendChild(element);
          
          // Set RTL direction
          rtlManager.setDirection('ar');
          
          // Handle bidirectional text
          rtlManager.handleBidirectionalText(element);
          
          // Verify bidirectional text handling
          const hasArabic = /[\u0600-\u06FF]/.test(mixedContent);
          const hasLatin = /[a-zA-Z]/.test(mixedContent);
          
          if (hasArabic && hasLatin) {
            expect(element.style.unicodeBidi).toBe('plaintext');
            expect(element.classList.contains('mixed-content')).toBe(true);
          } else if (hasArabic) {
            expect(element.style.unicodeBidi).toBe('embed');
            expect(element.classList.contains('arabic-flow')).toBe(true);
          }
          
          // Cleanup
          document.body.removeChild(element);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct unicode-bidi for pure Arabic text', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.char().filter(c => c >= '\u0600' && c <= '\u06FF'), { minLength: 1, maxLength: 50 }),
        (arabicText) => {
          // Create test element with pure Arabic text
          const element = document.createElement('div');
          element.textContent = arabicText;
          document.body.appendChild(element);
          
          // Set RTL direction
          rtlManager.setDirection('ar');
          
          // Handle bidirectional text
          rtlManager.handleBidirectionalText(element);
          
          // Verify Arabic text handling
          expect(element.style.unicodeBidi).toBe('embed');
          expect(element.classList.contains('arabic-flow')).toBe(true);
          expect(element.classList.contains('mixed-content')).toBe(false);
          
          // Cleanup
          document.body.removeChild(element);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not apply special handling for pure English text', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.char().filter(c => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === ' '), { minLength: 1, maxLength: 50 }),
        (englishText) => {
          // Create test element with pure English text
          const element = document.createElement('div');
          element.textContent = englishText;
          document.body.appendChild(element);
          
          // Set LTR direction
          rtlManager.setDirection('en');
          
          // Handle bidirectional text
          rtlManager.handleBidirectionalText(element);
          
          // Verify no special handling for pure English
          expect(element.style.unicodeBidi).toBe('');
          expect(element.classList.contains('mixed-content')).toBe(false);
          expect(element.classList.contains('arabic-flow')).toBe(false);
          
          // Cleanup
          document.body.removeChild(element);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve text content integrity during bidirectional handling', () => {
    fc.assert(
      fc.property(
        fc.record({
          arabicText: fc.stringOf(fc.char().filter(c => c >= '\u0600' && c <= '\u06FF'), { minLength: 1, maxLength: 20 }),
          englishText: fc.stringOf(fc.char().filter(c => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')), { minLength: 1, maxLength: 20 }),
          numbers: fc.stringOf(fc.char().filter(c => c >= '0' && c <= '9'), { minLength: 1, maxLength: 10 })
        }),
        ({ arabicText, englishText, numbers }) => {
          const originalContent = `${arabicText} ${englishText} ${numbers}`;
          
          // Create test element
          const element = document.createElement('div');
          element.textContent = originalContent;
          document.body.appendChild(element);
          
          // Set RTL direction and handle bidirectional text
          rtlManager.setDirection('ar');
          rtlManager.handleBidirectionalText(element);
          
          // Verify content integrity
          expect(element.textContent).toBe(originalContent);
          
          // Cleanup
          document.body.removeChild(element);
        }
      ),
      { numRuns: 100 }
    );
  });
}); 
 /**
   * **Feature: comprehensive-i18n-system, Property 10: Arabic numeral and date formatting**
   * **Validates: Requirements 5.4, 5.5**
   */
  it('should format Arabic numerals correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999999 }),
        (number) => {
          // Set RTL direction
          rtlManager.setDirection('ar');
          
          const numberString = number.toString();
          const formattedNumber = rtlManager.formatArabicContent(numberString, 'number');
          
          // Verify Arabic numerals are used
          const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
          const expectedFormatted = numberString.replace(/[0-9]/g, (digit) => {
            return arabicNumerals[parseInt(digit)];
          });
          
          expect(formattedNumber).toBe(expectedFormatted);
          
          // Verify all digits are converted
          for (let i = 0; i <= 9; i++) {
            if (numberString.includes(i.toString())) {
              expect(formattedNumber).toContain(arabicNumerals[i]);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format Arabic dates correctly', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (date) => {
          // Set RTL direction
          rtlManager.setDirection('ar');
          
          const dateString = date.toISOString();
          const formattedDate = rtlManager.formatArabicContent(dateString, 'date');
          
          // Verify date is formatted using Arabic locale
          const expectedFormat = new Intl.DateTimeFormat('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }).format(date);
          
          expect(formattedDate).toBe(expectedFormat);
          
          // Verify Arabic text is present (month names should be in Arabic)
          const hasArabicChars = /[\u0600-\u06FF]/.test(formattedDate);
          expect(hasArabicChars).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format Arabic currency correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.01, max: 999999.99, noNaN: true }),
        (amount) => {
          // Set RTL direction
          rtlManager.setDirection('ar');
          
          const amountString = amount.toString();
          const formattedCurrency = rtlManager.formatArabicContent(amountString, 'currency');
          
          // Verify currency is formatted using Arabic locale
          const expectedFormat = new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR'
          }).format(amount);
          
          expect(formattedCurrency).toBe(expectedFormat);
          
          // Verify SAR currency symbol or Arabic text is present
          const hasCurrencyIndicator = formattedCurrency.includes('ر.س') || 
                                     formattedCurrency.includes('SAR') ||
                                     /[\u0600-\u06FF]/.test(formattedCurrency);
          expect(hasCurrencyIndicator).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not format content when in LTR mode', () => {
    fc.assert(
      fc.property(
        fc.record({
          number: fc.integer({ min: 0, max: 9999 }),
          date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          amount: fc.float({ min: 0.01, max: 9999.99, noNaN: true })
        }),
        ({ number, date, amount }) => {
          // Set LTR direction
          rtlManager.setDirection('en');
          
          const numberString = number.toString();
          const dateString = date.toISOString();
          const amountString = amount.toString();
          
          // Format content
          const formattedNumber = rtlManager.formatArabicContent(numberString, 'number');
          const formattedDate = rtlManager.formatArabicContent(dateString, 'date');
          const formattedCurrency = rtlManager.formatArabicContent(amountString, 'currency');
          
          // Verify content remains unchanged in LTR mode
          expect(formattedNumber).toBe(numberString);
          expect(formattedDate).toBe(dateString);
          expect(formattedCurrency).toBe(amountString);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle invalid input gracefully', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string().filter(s => isNaN(Date.parse(s)) && isNaN(parseFloat(s))),
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (invalidInput) => {
          // Set RTL direction
          rtlManager.setDirection('ar');
          
          const inputString = invalidInput?.toString() || '';
          
          // Format invalid input should return original or handle gracefully
          const formattedNumber = rtlManager.formatArabicContent(inputString, 'number');
          const formattedDate = rtlManager.formatArabicContent(inputString, 'date');
          const formattedCurrency = rtlManager.formatArabicContent(inputString, 'currency');
          
          // Should not throw errors and return some valid string
          expect(typeof formattedNumber).toBe('string');
          expect(typeof formattedDate).toBe('string');
          expect(typeof formattedCurrency).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });
});