/**
 * Testing utilities for translation coverage and validation
 */

import type { Locale } from '../types';

export interface TranslationCoverageReport {
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  coveragePercentage: number;
  locale: Locale;
  namespace: string;
}

export interface RTLLayoutValidationResult {
  isValid: boolean;
  issues: string[];
  element: HTMLElement;
  expectedDirection: 'ltr' | 'rtl';
  actualDirection: string;
}

export interface FormatValidationResult {
  isValid: boolean;
  input: any;
  output: string;
  expectedPattern?: RegExp;
  locale: Locale;
  formatType: 'number' | 'currency' | 'date' | 'time' | 'percentage';
}

/**
 * Utility class for testing translation coverage
 */
export class TranslationTestUtils {
  /**
   * Check translation coverage for a specific locale and namespace
   */
  static checkTranslationCoverage(
    translations: Record<string, string>,
    requiredKeys: string[],
    locale: Locale,
    namespace: string = 'common'
  ): TranslationCoverageReport {
    const missingKeys = requiredKeys.filter(key => !translations[key] || translations[key] === key);
    const translatedKeys = requiredKeys.length - missingKeys.length;
    const coveragePercentage = requiredKeys.length > 0 ? (translatedKeys / requiredKeys.length) * 100 : 100;

    return {
      totalKeys: requiredKeys.length,
      translatedKeys,
      missingKeys,
      coveragePercentage,
      locale,
      namespace,
    };
  }

  /**
   * Detect missing translations by checking if translation returns the key
   */
  static detectMissingTranslations(
    translationFunction: (key: string) => string,
    testKeys: string[]
  ): string[] {
    return testKeys.filter(key => {
      const translation = translationFunction(key);
      return translation === key; // If translation equals key, it's missing
    });
  }

  /**
   * Validate RTL layout for Arabic text
   */
  static validateRTLLayout(element: HTMLElement, expectedDirection: 'ltr' | 'rtl'): RTLLayoutValidationResult {
    const issues: string[] = [];
    
    // Check dir attribute
    const dirAttribute = element.getAttribute('dir') || 
                        element.closest('[dir]')?.getAttribute('dir') || 
                        document.documentElement.getAttribute('dir') || 'ltr';
    
    if (dirAttribute !== expectedDirection) {
      issues.push(`Expected dir="${expectedDirection}" but found dir="${dirAttribute}"`);
    }

    // Check CSS direction property
    const computedStyle = window.getComputedStyle(element);
    const cssDirection = computedStyle.direction;
    
    if (cssDirection !== expectedDirection) {
      issues.push(`Expected CSS direction: ${expectedDirection} but found: ${cssDirection}`);
    }

    // Check text alignment for RTL
    if (expectedDirection === 'rtl') {
      const textAlign = computedStyle.textAlign;
      if (textAlign !== 'right' && textAlign !== 'start') {
        issues.push(`RTL element should have text-align: right or start, but found: ${textAlign}`);
      }
    }

    // Check for Arabic font if RTL
    if (expectedDirection === 'rtl') {
      const fontFamily = computedStyle.fontFamily.toLowerCase();
      if (!fontFamily.includes('tajawal') && !fontFamily.includes('arabic')) {
        issues.push(`RTL element should use Arabic font (Tajawal), but found: ${fontFamily}`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      element,
      expectedDirection,
      actualDirection: dirAttribute,
    };
  }

  /**
   * Validate Arabic text rendering
   */
  static validateArabicTextRendering(element: HTMLElement): RTLLayoutValidationResult {
    const issues: string[] = [];
    const computedStyle = window.getComputedStyle(element);
    
    // Check for Arabic text content
    const textContent = element.textContent || '';
    const hasArabicText = /[\u0600-\u06FF]/.test(textContent);
    
    if (hasArabicText) {
      // Check font features for Arabic text shaping
      const fontFeatureSettings = computedStyle.fontFeatureSettings;
      if (!fontFeatureSettings.includes('liga') && !fontFeatureSettings.includes('calt')) {
        issues.push('Arabic text should have font-feature-settings for proper shaping');
      }

      // Check text rendering
      const textRendering = computedStyle.textRendering;
      if (textRendering !== 'optimizeLegibility') {
        issues.push('Arabic text should have text-rendering: optimizeLegibility');
      }

      // Check unicode-bidi for mixed content
      const unicodeBidi = computedStyle.unicodeBidi;
      const hasLatinText = /[a-zA-Z]/.test(textContent);
      
      if (hasLatinText && unicodeBidi !== 'plaintext') {
        issues.push('Mixed Arabic/Latin text should have unicode-bidi: plaintext');
      } else if (!hasLatinText && unicodeBidi !== 'embed') {
        issues.push('Pure Arabic text should have unicode-bidi: embed');
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      element,
      expectedDirection: 'rtl',
      actualDirection: computedStyle.direction,
    };
  }

  /**
   * Validate number formatting for locale
   */
  static validateNumberFormat(
    input: number,
    output: string,
    locale: Locale,
    options?: Intl.NumberFormatOptions
  ): FormatValidationResult {
    try {
      const expectedFormatter = new Intl.NumberFormat(
        locale === 'ar' ? 'ar-SA' : 'en-US',
        options
      );
      const expectedOutput = expectedFormatter.format(input);
      
      const isValid = output === expectedOutput;
      
      return {
        isValid,
        input,
        output,
        locale,
        formatType: 'number',
        expectedPattern: undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        input,
        output,
        locale,
        formatType: 'number',
      };
    }
  }

  /**
   * Validate currency formatting for locale
   */
  static validateCurrencyFormat(
    input: number,
    output: string,
    locale: Locale,
    currency: string = 'SAR'
  ): FormatValidationResult {
    try {
      const expectedFormatter = new Intl.NumberFormat(
        locale === 'ar' ? 'ar-SA' : 'en-US',
        { style: 'currency', currency }
      );
      const expectedOutput = expectedFormatter.format(input);
      
      const isValid = output === expectedOutput;
      
      return {
        isValid,
        input,
        output,
        locale,
        formatType: 'currency',
      };
    } catch (error) {
      return {
        isValid: false,
        input,
        output,
        locale,
        formatType: 'currency',
      };
    }
  }

  /**
   * Validate date formatting for locale
   */
  static validateDateFormat(
    input: Date,
    output: string,
    locale: Locale,
    options?: Intl.DateTimeFormatOptions
  ): FormatValidationResult {
    try {
      const expectedFormatter = new Intl.DateTimeFormat(
        locale === 'ar' ? 'ar-SA' : 'en-US',
        options || { year: 'numeric', month: 'long', day: 'numeric' }
      );
      const expectedOutput = expectedFormatter.format(input);
      
      const isValid = output === expectedOutput;
      
      return {
        isValid,
        input,
        output,
        locale,
        formatType: 'date',
      };
    } catch (error) {
      return {
        isValid: false,
        input,
        output,
        locale,
        formatType: 'date',
      };
    }
  }

  /**
   * Test strict language selection (no fallback behavior)
   */
  static testStrictLanguageSelection(
    translationFunction: (key: string, locale?: Locale) => string,
    testKey: string,
    availableLocales: Locale[]
  ): { locale: Locale; hasTranslation: boolean; returnedValue: string }[] {
    return availableLocales.map(locale => {
      const returnedValue = translationFunction(testKey, locale);
      const hasTranslation = returnedValue !== testKey;
      
      return {
        locale,
        hasTranslation,
        returnedValue,
      };
    });
  }

  /**
   * Generate test report for translation system
   */
  static generateTestReport(
    coverageReports: TranslationCoverageReport[],
    rtlValidations: RTLLayoutValidationResult[],
    formatValidations: FormatValidationResult[]
  ): {
    summary: {
      totalCoverage: number;
      rtlIssues: number;
      formatIssues: number;
      overallScore: number;
    };
    details: {
      coverage: TranslationCoverageReport[];
      rtl: RTLLayoutValidationResult[];
      formatting: FormatValidationResult[];
    };
  } {
    const totalCoverage = coverageReports.length > 0 
      ? coverageReports.reduce((sum, report) => sum + report.coveragePercentage, 0) / coverageReports.length
      : 100;
    
    const rtlIssues = rtlValidations.filter(validation => !validation.isValid).length;
    const formatIssues = formatValidations.filter(validation => !validation.isValid).length;
    
    const overallScore = Math.max(0, 100 - (
      (100 - totalCoverage) + 
      (rtlIssues * 5) + 
      (formatIssues * 3)
    ));

    return {
      summary: {
        totalCoverage,
        rtlIssues,
        formatIssues,
        overallScore,
      },
      details: {
        coverage: coverageReports,
        rtl: rtlValidations,
        formatting: formatValidations,
      },
    };
  }

  /**
   * Create mock translation function for testing
   */
  static createMockTranslationFunction(
    translations: Record<Locale, Record<string, string>>
  ): (key: string, locale?: Locale) => string {
    return (key: string, locale: Locale = 'en') => {
      return translations[locale]?.[key] || key;
    };
  }

  /**
   * Validate that no fallback behavior exists
   */
  static validateNoFallbackBehavior(
    translationFunction: (key: string, locale: Locale) => string,
    testKey: string,
    primaryLocale: Locale,
    fallbackLocale: Locale
  ): boolean {
    // Key should not exist in primary locale
    const primaryResult = translationFunction(testKey, primaryLocale);
    
    // Key should exist in fallback locale
    const fallbackResult = translationFunction(testKey, fallbackLocale);
    
    // Primary should return key (not fallback value)
    return primaryResult === testKey && fallbackResult !== testKey;
  }
}

export default TranslationTestUtils;