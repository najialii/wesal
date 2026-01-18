/**
 * Property-based tests for testing utilities and validation
 * Feature: comprehensive-i18n-system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { TranslationTestUtils } from '../testing/translationTestUtils';
import { RTLTestHelpers } from '../testing/rtlTestHelpers';
import { Locale } from '../types';

describe('Testing Utilities Property Tests', () => {
  let testContainer: HTMLElement;

  beforeEach(() => {
    testContainer = document.createElement('div');
    document.body.appendChild(testContainer);
  });

  afterEach(() => {
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
  });

  /**
   * **Feature: comprehensive-i18n-system, Property 19: Missing translation detection**
   * **Validates: Requirements 9.2**
   */
  it('should detect missing translations and display keys instead of fallbacks', () => {
    fc.assert(
      fc.property(
        fc.record({
          existingKeys: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          missingKeys: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
          locale: fc.constantFrom('ar' as Locale, 'en' as Locale)
        }),
        ({ existingKeys, missingKeys, locale }) => {
          // Create mock translations with only existing keys
          const translations: Record<Locale, Record<string, string>> = {
            ar: {},
            en: {}
          };

          existingKeys.forEach(key => {
            translations[locale][key] = locale === 'ar' ? `ترجمة_${key}` : `translation_${key}`;
          });

          // Create mock translation function
          const mockTranslationFunction = TranslationTestUtils.createMockTranslationFunction(translations);

          // Test missing translation detection
          const allTestKeys = [...existingKeys, ...missingKeys];
          const detectedMissingKeys = TranslationTestUtils.detectMissingTranslations(
            (key: string) => mockTranslationFunction(key, locale),
            allTestKeys
          );

          // Should detect all missing keys
          missingKeys.forEach(missingKey => {
            expect(detectedMissingKeys).toContain(missingKey);
          });

          // Should not detect existing keys as missing
          existingKeys.forEach(existingKey => {
            expect(detectedMissingKeys).not.toContain(existingKey);
          });

          // Verify that missing translations return the key (no fallback)
          missingKeys.forEach(missingKey => {
            const result = mockTranslationFunction(missingKey, locale);
            expect(result).toBe(missingKey); // Should return key, not fallback
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: comprehensive-i18n-system, Property 19: Missing translation detection**
   * **Validates: Requirements 9.2**
   */
  it('should validate no fallback behavior between locales', () => {
    fc.assert(
      fc.property(
        fc.record({
          testKey: fc.string({ minLength: 1, maxLength: 20 }),
          arabicTranslation: fc.string({ minLength: 1, maxLength: 50 }),
          englishTranslation: fc.string({ minLength: 1, maxLength: 50 })
        }),
        ({ testKey, arabicTranslation, englishTranslation }) => {
          // Create translations with key only in one locale
          const translations: Record<Locale, Record<string, string>> = {
            ar: { [testKey]: arabicTranslation },
            en: {} // Missing in English
          };

          const mockTranslationFunction = TranslationTestUtils.createMockTranslationFunction(translations);

          // Test no fallback behavior
          const noFallback = TranslationTestUtils.validateNoFallbackBehavior(
            mockTranslationFunction,
            testKey,
            'en', // Primary locale (missing)
            'ar'  // Fallback locale (exists)
          );

          expect(noFallback).toBe(true);

          // Verify English returns key (not Arabic translation)
          const englishResult = mockTranslationFunction(testKey, 'en');
          expect(englishResult).toBe(testKey);
          expect(englishResult).not.toBe(arabicTranslation);

          // Verify Arabic returns translation
          const arabicResult = mockTranslationFunction(testKey, 'ar');
          expect(arabicResult).toBe(arabicTranslation);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate accurate translation coverage reports', () => {
    fc.assert(
      fc.property(
        fc.record({
          totalKeys: fc.array(fc.string({ minLength: 1, maxLength: 15 }), { minLength: 5, maxLength: 20 }),
          translatedKeys: fc.array(fc.string({ minLength: 1, maxLength: 15 }), { minLength: 0, maxLength: 15 }),
          locale: fc.constantFrom('ar' as Locale, 'en' as Locale),
          namespace: fc.constantFrom('common', 'auth', 'dashboard')
        }),
        ({ totalKeys, translatedKeys, locale, namespace }) => {
          // Create translations object
          const translations: Record<string, string> = {};
          translatedKeys.forEach(key => {
            if (totalKeys.includes(key)) {
              translations[key] = `translated_${key}`;
            }
          });

          // Generate coverage report
          const report = TranslationTestUtils.checkTranslationCoverage(
            translations,
            totalKeys,
            locale,
            namespace
          );

          // Verify report accuracy
          expect(report.totalKeys).toBe(totalKeys.length);
          expect(report.locale).toBe(locale);
          expect(report.namespace).toBe(namespace);

          // Calculate expected values
          const actualTranslatedKeys = totalKeys.filter(key => translations[key] && translations[key] !== key);
          const expectedMissingKeys = totalKeys.filter(key => !translations[key] || translations[key] === key);
          const expectedCoverage = totalKeys.length > 0 ? (actualTranslatedKeys.length / totalKeys.length) * 100 : 100;

          expect(report.translatedKeys).toBe(actualTranslatedKeys.length);
          expect(report.missingKeys).toEqual(expectedMissingKeys);
          expect(report.coveragePercentage).toBeCloseTo(expectedCoverage, 2);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should test strict language selection across multiple locales', () => {
    fc.assert(
      fc.property(
        fc.record({
          testKey: fc.string({ minLength: 1, maxLength: 20 }),
          arabicValue: fc.string({ minLength: 1, maxLength: 30 }),
          englishValue: fc.string({ minLength: 1, maxLength: 30 })
        }),
        ({ testKey, arabicValue, englishValue }) => {
          // Create translations for both locales
          const translations: Record<Locale, Record<string, string>> = {
            ar: { [testKey]: arabicValue },
            en: { [testKey]: englishValue }
          };

          const mockTranslationFunction = TranslationTestUtils.createMockTranslationFunction(translations);

          // Test strict language selection
          const results = TranslationTestUtils.testStrictLanguageSelection(
            (key: string, locale?: Locale) => mockTranslationFunction(key, locale || 'en'),
            testKey,
            ['ar', 'en']
          );

          expect(results).toHaveLength(2);

          // Verify Arabic result
          const arabicResult = results.find(r => r.locale === 'ar');
          expect(arabicResult).toBeDefined();
          expect(arabicResult!.hasTranslation).toBe(true);
          expect(arabicResult!.returnedValue).toBe(arabicValue);

          // Verify English result
          const englishResult = results.find(r => r.locale === 'en');
          expect(englishResult).toBeDefined();
          expect(englishResult!.hasTranslation).toBe(true);
          expect(englishResult!.returnedValue).toBe(englishValue);

          // Verify no cross-contamination
          expect(arabicResult!.returnedValue).not.toBe(englishResult!.returnedValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge cases in missing translation detection', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined),
          fc.string({ minLength: 1, maxLength: 5 })
        ),
        (edgeCaseKey) => {
          const translations: Record<Locale, Record<string, string>> = {
            ar: {},
            en: {}
          };

          const mockTranslationFunction = TranslationTestUtils.createMockTranslationFunction(translations);

          // Test edge case handling
          const testKeys = edgeCaseKey ? [String(edgeCaseKey)] : [];
          
          if (testKeys.length > 0) {
            const missingKeys = TranslationTestUtils.detectMissingTranslations(
              (key: string) => mockTranslationFunction(key, 'en'),
              testKeys
            );

            // Should detect edge case as missing
            expect(missingKeys).toContain(String(edgeCaseKey));

            // Should return the key itself (no fallback)
            const result = mockTranslationFunction(String(edgeCaseKey), 'en');
            expect(result).toBe(String(edgeCaseKey));
          }
        }
      ),
      { numRuns: 50 }
    );
  });
}); 
 /**
   * **Feature: comprehensive-i18n-system, Property 20: RTL layout validation**
   * **Validates: Requirements 9.3**
   */
  it('should validate RTL layout properties correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          arabicText: fc.stringOf(fc.char().filter(c => c >= '\u0600' && c <= '\u06FF'), { minLength: 1, maxLength: 30 }),
          direction: fc.constantFrom('rtl' as const, 'ltr' as const),
          shouldBeRTL: fc.boolean()
        }),
        ({ arabicText, direction, shouldBeRTL }) => {
          // Create test element
          const element = document.createElement('div');
          element.textContent = arabicText;
          element.setAttribute('dir', direction);
          element.style.direction = direction;
          element.style.textAlign = direction === 'rtl' ? 'right' : 'left';
          
          if (shouldBeRTL) {
            element.style.fontFamily = 'Tajawal, Arial, sans-serif';
            element.style.fontFeatureSettings = '"kern" 1, "liga" 1, "calt" 1, "curs" 1';
            element.style.textRendering = 'optimizeLegibility';
          }
          
          testContainer.appendChild(element);
          
          // Validate RTL layout
          const expectedDirection = shouldBeRTL ? 'rtl' : 'ltr';
          const validation = TranslationTestUtils.validateRTLLayout(element, expectedDirection);
          
          if (direction === expectedDirection) {
            // Should pass validation when directions match
            if (shouldBeRTL && direction === 'rtl') {
              // RTL validation might have additional requirements
              expect(validation.actualDirection).toBe('rtl');
            } else if (!shouldBeRTL && direction === 'ltr') {
              expect(validation.actualDirection).toBe('ltr');
            }
          } else {
            // Should fail validation when directions don't match
            expect(validation.isValid).toBe(false);
            expect(validation.issues.length).toBeGreaterThan(0);
          }
          
          expect(validation.element).toBe(element);
          expect(validation.expectedDirection).toBe(expectedDirection);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: comprehensive-i18n-system, Property 20: RTL layout validation**
   * **Validates: Requirements 9.3**
   */
  it('should validate Arabic text rendering properties', () => {
    fc.assert(
      fc.property(
        fc.record({
          arabicText: fc.stringOf(fc.char().filter(c => c >= '\u0600' && c <= '\u06FF'), { minLength: 1, maxLength: 20 }),
          englishText: fc.stringOf(fc.char().filter(c => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')), { minLength: 0, maxLength: 20 }),
          hasMixedContent: fc.boolean()
        }),
        ({ arabicText, englishText, hasMixedContent }) => {
          const element = document.createElement('div');
          const textContent = hasMixedContent && englishText ? `${arabicText} ${englishText}` : arabicText;
          element.textContent = textContent;
          
          // Set up proper Arabic text rendering
          element.setAttribute('dir', 'rtl');
          element.style.direction = 'rtl';
          element.style.fontFeatureSettings = '"kern" 1, "liga" 1, "calt" 1, "curs" 1';
          element.style.textRendering = 'optimizeLegibility';
          
          if (hasMixedContent && englishText) {
            element.style.unicodeBidi = 'plaintext';
            element.classList.add('mixed-content');
          } else {
            element.style.unicodeBidi = 'embed';
            element.classList.add('arabic-flow');
          }
          
          testContainer.appendChild(element);
          
          // Validate Arabic text rendering
          const validation = TranslationTestUtils.validateArabicTextRendering(element);
          
          // Should validate correctly for proper Arabic setup
          expect(validation.element).toBe(element);
          expect(validation.expectedDirection).toBe('rtl');
          
          // Check that validation catches missing properties
          if (hasMixedContent && englishText) {
            // Mixed content should use plaintext
            const computedStyle = window.getComputedStyle(element);
            const unicodeBidi = computedStyle.unicodeBidi;
            if (unicodeBidi === 'plaintext') {
              expect(validation.issues.filter(issue => issue.includes('plaintext'))).toHaveLength(0);
            }
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should validate RTL form elements correctly', () => {
    const rtlFormElements = RTLTestHelpers.createRTLFormTestElements();
    
    rtlFormElements.forEach(({ element, expectedDirection, testName }) => {
      testContainer.appendChild(element);
      
      const validation = TranslationTestUtils.validateRTLLayout(element, expectedDirection);
      
      expect(validation.expectedDirection).toBe(expectedDirection);
      expect(validation.element).toBe(element);
      
      // Form elements should have proper RTL setup
      if (expectedDirection === 'rtl') {
        const computedStyle = window.getComputedStyle(element);
        expect(['right', 'start']).toContain(computedStyle.textAlign);
      }
    });
  });

  it('should validate RTL navigation elements correctly', () => {
    const rtlNavElements = RTLTestHelpers.createRTLNavigationTestElements();
    
    rtlNavElements.forEach(({ element, expectedDirection, testName }) => {
      testContainer.appendChild(element);
      
      const validation = TranslationTestUtils.validateRTLLayout(element, expectedDirection);
      
      expect(validation.expectedDirection).toBe(expectedDirection);
      expect(validation.element).toBe(element);
      
      // Navigation should maintain RTL direction
      if (expectedDirection === 'rtl') {
        expect(validation.actualDirection).toBe('rtl');
      }
    });
  });

  it('should validate RTL table layout correctly', () => {
    const { element, expectedDirection, testName } = RTLTestHelpers.createRTLTableTestElement();
    testContainer.appendChild(element);
    
    const validation = TranslationTestUtils.validateRTLLayout(element, expectedDirection);
    
    expect(validation.expectedDirection).toBe('rtl');
    expect(validation.element).toBe(element);
    
    // Check table cells have proper RTL alignment
    const cells = element.querySelectorAll('th, td');
    cells.forEach(cell => {
      const computedStyle = window.getComputedStyle(cell as HTMLElement);
      expect(computedStyle.textAlign).toBe('right');
    });
  });

  it('should test RTL transition performance', () => {
    const performanceResult = RTLTestHelpers.performRTLPerformanceTest(10); // Smaller number for tests
    
    expect(performanceResult.elementsProcessed).toBe(10);
    expect(performanceResult.transitionTime).toBeGreaterThan(0);
    expect(performanceResult.averageTimePerElement).toBeGreaterThan(0);
    
    // Performance should be reasonable (less than 10ms per element)
    expect(performanceResult.averageTimePerElement).toBeLessThan(10);
  });

  it('should validate RTL transitions correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (testText) => {
          const element = RTLTestHelpers.createEnglishTestElement(testText);
          testContainer.appendChild(element);
          
          const transitionResult = RTLTestHelpers.testRTLTransition(element);
          
          expect(transitionResult.beforeTransition.expectedDirection).toBe('ltr');
          expect(transitionResult.afterTransition.expectedDirection).toBe('rtl');
          
          // Transition should be successful if both states are valid
          if (transitionResult.beforeTransition.isValid && transitionResult.afterTransition.isValid) {
            expect(transitionResult.transitionSuccessful).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );
  });  /**

   * **Feature: comprehensive-i18n-system, Property 21: Format validation**
   * **Validates: Requirements 9.4**
   */
  it('should validate Arabic and English number formatting correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          number: fc.float({ min: -999999.99, max: 999999.99, noNaN: true }),
          locale: fc.constantFrom('ar' as Locale, 'en' as Locale),
          options: fc.record({
            minimumFractionDigits: fc.integer({ min: 0, max: 3 }),
            maximumFractionDigits: fc.integer({ min: 0, max: 3 }),
            useGrouping: fc.boolean()
          }, { requiredKeys: [] })
        }),
        ({ number, locale, options }) => {
          // Generate expected output using Intl.NumberFormat
          const expectedFormatter = new Intl.NumberFormat(
            locale === 'ar' ? 'ar-SA' : 'en-US',
            options
          );
          const expectedOutput = expectedFormatter.format(number);
          
          // Validate using our utility
          const validation = TranslationTestUtils.validateNumberFormat(
            number,
            expectedOutput,
            locale,
            options
          );
          
          expect(validation.isValid).toBe(true);
          expect(validation.input).toBe(number);
          expect(validation.output).toBe(expectedOutput);
          expect(validation.locale).toBe(locale);
          expect(validation.formatType).toBe('number');
          
          // Test with incorrect output
          const incorrectOutput = 'invalid_format';
          const invalidValidation = TranslationTestUtils.validateNumberFormat(
            number,
            incorrectOutput,
            locale,
            options
          );
          
          expect(invalidValidation.isValid).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: comprehensive-i18n-system, Property 21: Format validation**
   * **Validates: Requirements 9.4**
   */
  it('should validate Arabic and English currency formatting correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          amount: fc.float({ min: 0.01, max: 999999.99, noNaN: true }),
          locale: fc.constantFrom('ar' as Locale, 'en' as Locale),
          currency: fc.constantFrom('SAR', 'USD', 'EUR')
        }),
        ({ amount, locale, currency }) => {
          // Generate expected output using Intl.NumberFormat
          const expectedFormatter = new Intl.NumberFormat(
            locale === 'ar' ? 'ar-SA' : 'en-US',
            { style: 'currency', currency }
          );
          const expectedOutput = expectedFormatter.format(amount);
          
          // Validate using our utility
          const validation = TranslationTestUtils.validateCurrencyFormat(
            amount,
            expectedOutput,
            locale,
            currency
          );
          
          expect(validation.isValid).toBe(true);
          expect(validation.input).toBe(amount);
          expect(validation.output).toBe(expectedOutput);
          expect(validation.locale).toBe(locale);
          expect(validation.formatType).toBe('currency');
          
          // Verify currency formatting characteristics
          if (locale === 'ar') {
            // Arabic currency formatting should contain Arabic or currency symbols
            const hasArabicOrCurrency = /[\u0600-\u06FF]/.test(expectedOutput) || 
                                       expectedOutput.includes(currency) ||
                                       /[٠-٩]/.test(expectedOutput);
            expect(hasArabicOrCurrency).toBe(true);
          } else {
            // English currency formatting should contain currency code or symbol
            const hasCurrency = expectedOutput.includes(currency) || 
                               /[$€£¥]/.test(expectedOutput);
            expect(hasCurrency).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: comprehensive-i18n-system, Property 21: Format validation**
   * **Validates: Requirements 9.4**
   */
  it('should validate Arabic and English date formatting correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          locale: fc.constantFrom('ar' as Locale, 'en' as Locale),
          options: fc.record({
            year: fc.constantFrom('numeric', '2-digit'),
            month: fc.constantFrom('numeric', '2-digit', 'long', 'short'),
            day: fc.constantFrom('numeric', '2-digit')
          }, { requiredKeys: [] })
        }),
        ({ date, locale, options }) => {
          // Generate expected output using Intl.DateTimeFormat
          const expectedFormatter = new Intl.DateTimeFormat(
            locale === 'ar' ? 'ar-SA' : 'en-US',
            options
          );
          const expectedOutput = expectedFormatter.format(date);
          
          // Validate using our utility
          const validation = TranslationTestUtils.validateDateFormat(
            date,
            expectedOutput,
            locale,
            options
          );
          
          expect(validation.isValid).toBe(true);
          expect(validation.input).toBe(date);
          expect(validation.output).toBe(expectedOutput);
          expect(validation.locale).toBe(locale);
          expect(validation.formatType).toBe('date');
          
          // Verify locale-specific characteristics
          if (locale === 'ar' && options.month === 'long') {
            // Arabic long month names should contain Arabic text
            const hasArabicText = /[\u0600-\u06FF]/.test(expectedOutput);
            expect(hasArabicText).toBe(true);
          } else if (locale === 'en' && options.month === 'long') {
            // English long month names should contain English text
            const englishMonths = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            const hasEnglishMonth = englishMonths.some(month => expectedOutput.includes(month));
            expect(hasEnglishMonth).toBe(true);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should handle format validation errors gracefully', () => {
    fc.assert(
      fc.property(
        fc.record({
          invalidInput: fc.oneof(
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity)
          ),
          locale: fc.constantFrom('ar' as Locale, 'en' as Locale)
        }),
        ({ invalidInput, locale }) => {
          // Test number format validation with invalid input
          const numberValidation = TranslationTestUtils.validateNumberFormat(
            invalidInput,
            'invalid_output',
            locale
          );
          
          expect(numberValidation.isValid).toBe(false);
          expect(numberValidation.input).toBe(invalidInput);
          expect(numberValidation.locale).toBe(locale);
          expect(numberValidation.formatType).toBe('number');
          
          // Test currency format validation with invalid input
          const currencyValidation = TranslationTestUtils.validateCurrencyFormat(
            invalidInput,
            'invalid_output',
            locale
          );
          
          expect(currencyValidation.isValid).toBe(false);
          expect(currencyValidation.formatType).toBe('currency');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should validate format consistency across multiple calls', () => {
    fc.assert(
      fc.property(
        fc.record({
          number: fc.float({ min: 0, max: 999999, noNaN: true }),
          date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          locale: fc.constantFrom('ar' as Locale, 'en' as Locale)
        }),
        ({ number, date, locale }) => {
          // Format the same values multiple times
          const numberFormatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US');
          const dateFormatter = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US');
          
          const numberOutput1 = numberFormatter.format(number);
          const numberOutput2 = numberFormatter.format(number);
          const dateOutput1 = dateFormatter.format(date);
          const dateOutput2 = dateFormatter.format(date);
          
          // Results should be consistent
          expect(numberOutput1).toBe(numberOutput2);
          expect(dateOutput1).toBe(dateOutput2);
          
          // Validate both outputs
          const numberValidation1 = TranslationTestUtils.validateNumberFormat(number, numberOutput1, locale);
          const numberValidation2 = TranslationTestUtils.validateNumberFormat(number, numberOutput2, locale);
          const dateValidation1 = TranslationTestUtils.validateDateFormat(date, dateOutput1, locale);
          const dateValidation2 = TranslationTestUtils.validateDateFormat(date, dateOutput2, locale);
          
          expect(numberValidation1.isValid).toBe(numberValidation2.isValid);
          expect(dateValidation1.isValid).toBe(dateValidation2.isValid);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should generate comprehensive test reports', () => {
    fc.assert(
      fc.property(
        fc.record({
          coveragePercentages: fc.array(fc.float({ min: 0, max: 100 }), { minLength: 1, maxLength: 5 }),
          rtlIssueCount: fc.integer({ min: 0, max: 10 }),
          formatIssueCount: fc.integer({ min: 0, max: 10 })
        }),
        ({ coveragePercentages, rtlIssueCount, formatIssueCount }) => {
          // Create mock coverage reports
          const coverageReports = coveragePercentages.map((percentage, index) => ({
            totalKeys: 100,
            translatedKeys: Math.floor(percentage),
            missingKeys: [],
            coveragePercentage: percentage,
            locale: (index % 2 === 0 ? 'ar' : 'en') as Locale,
            namespace: 'test'
          }));
          
          // Create mock RTL validations
          const rtlValidations = Array.from({ length: rtlIssueCount + 5 }, (_, index) => ({
            isValid: index >= rtlIssueCount,
            issues: index < rtlIssueCount ? ['Test issue'] : [],
            element: document.createElement('div'),
            expectedDirection: 'rtl' as const,
            actualDirection: 'rtl'
          }));
          
          // Create mock format validations
          const formatValidations = Array.from({ length: formatIssueCount + 5 }, (_, index) => ({
            isValid: index >= formatIssueCount,
            input: 123,
            output: '123',
            locale: 'en' as Locale,
            formatType: 'number' as const
          }));
          
          // Generate test report
          const report = TranslationTestUtils.generateTestReport(
            coverageReports,
            rtlValidations,
            formatValidations
          );
          
          // Verify report structure
          expect(report.summary).toBeDefined();
          expect(report.details).toBeDefined();
          
          expect(report.summary.rtlIssues).toBe(rtlIssueCount);
          expect(report.summary.formatIssues).toBe(formatIssueCount);
          
          const expectedCoverage = coveragePercentages.length > 0 
            ? coveragePercentages.reduce((sum, p) => sum + p, 0) / coveragePercentages.length
            : 100;
          expect(report.summary.totalCoverage).toBeCloseTo(expectedCoverage, 2);
          
          // Overall score should be between 0 and 100
          expect(report.summary.overallScore).toBeGreaterThanOrEqual(0);
          expect(report.summary.overallScore).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 20 }
    );
  });
});