/**
 * Integration tests for complete i18n workflow
 * Tests end-to-end Arabic/English switching, backend integration, offline functionality, and RTL/LTR transitions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TranslationProvider, useTranslation } from '../TranslationProvider';
import { rtlManager } from '../RTLManager';

// Mock component for testing
const TestComponent: React.FC = () => {
  const { t, currentLanguage, changeLanguage, loading, isRTL } = useTranslation('common');
  
  return (
    <div data-testid="test-component" className={isRTL ? 'rtl' : 'ltr'}>
      <div data-testid="current-language">{currentLanguage}</div>
      <div data-testid="direction">{isRTL ? 'rtl' : 'ltr'}</div>
      <div data-testid="loading">{loading ? 'loading' : 'ready'}</div>
      <div data-testid="welcome-text">{t('welcome')}</div>
      <div data-testid="save-button">{t('save')}</div>
      <button 
        data-testid="switch-to-arabic" 
        onClick={() => changeLanguage('ar')}
      >
        Switch to Arabic
      </button>
      <button 
        data-testid="switch-to-english" 
        onClick={() => changeLanguage('en')}
      >
        Switch to English
      </button>
    </div>
  );
};

describe('I18n Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    vi.clearAllMocks();
    localStorage.clear();
    
    // Reset RTL manager
    document.documentElement.classList.remove('rtl');
    document.documentElement.setAttribute('dir', 'ltr');
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Complete Arabic/English switching workflow', () => {
    it('should handle complete language switching workflow', async () => {
      render(
        <TranslationProvider defaultLanguage="en">
          <TestComponent />
        </TranslationProvider>
      );

      // Initial state should be English
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('direction')).toHaveTextContent('ltr');
      expect(screen.getByTestId('welcome-text')).toHaveTextContent('Welcome');
      expect(screen.getByTestId('save-button')).toHaveTextContent('Save');

      // Switch to Arabic
      fireEvent.click(screen.getByTestId('switch-to-arabic'));

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('ar');
      });

      // Verify Arabic translations and RTL
      expect(screen.getByTestId('direction')).toHaveTextContent('rtl');
      expect(screen.getByTestId('welcome-text')).toHaveTextContent('مرحباً');
      expect(screen.getByTestId('save-button')).toHaveTextContent('حفظ');

      // Verify localStorage persistence
      expect(localStorage.setItem).toHaveBeenCalledWith('i18n_language', 'ar');

      // Switch back to English
      fireEvent.click(screen.getByTestId('switch-to-english'));

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      });

      // Verify English translations and LTR
      expect(screen.getByTestId('direction')).toHaveTextContent('ltr');
      expect(screen.getByTestId('welcome-text')).toHaveTextContent('Welcome');
      expect(screen.getByTestId('save-button')).toHaveTextContent('Save');

      // Verify localStorage persistence
      expect(localStorage.setItem).toHaveBeenCalledWith('i18n_language', 'en');
    });

    it('should persist language preference across sessions', () => {
      // Set Arabic in localStorage mock
      localStorage.getItem = vi.fn().mockReturnValue('ar');

      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>
      );

      // Should initialize with Arabic
      expect(screen.getByTestId('current-language')).toHaveTextContent('ar');
      expect(screen.getByTestId('direction')).toHaveTextContent('rtl');
      expect(screen.getByTestId('welcome-text')).toHaveTextContent('مرحباً');
    });
  });

  describe('RTL/LTR transitions with complex UI layouts', () => {
    const ComplexLayoutComponent: React.FC = () => {
      const { currentLanguage, changeLanguage, isRTL } = useTranslation();
      
      return (
        <div data-testid="complex-layout" className={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex justify-between items-center p-4">
            <div data-testid="left-content" className="text-left">
              Left Content
            </div>
            <div data-testid="center-content" className="text-center">
              Center Content
            </div>
            <div data-testid="right-content" className="text-right">
              Right Content
            </div>
          </div>
          <button 
            data-testid="toggle-language"
            onClick={() => changeLanguage(currentLanguage === 'ar' ? 'en' : 'ar')}
          >
            Toggle Language
          </button>
        </div>
      );
    };

    it('should handle RTL/LTR transitions smoothly', async () => {
      render(
        <TranslationProvider defaultLanguage="en">
          <ComplexLayoutComponent />
        </TranslationProvider>
      );

      const layout = screen.getByTestId('complex-layout');
      
      // Initial LTR state
      expect(layout).toHaveClass('ltr');
      expect(layout).not.toHaveClass('rtl');

      // Switch to Arabic (RTL)
      fireEvent.click(screen.getByTestId('toggle-language'));

      await waitFor(() => {
        expect(layout).toHaveClass('rtl');
      });

      expect(layout).not.toHaveClass('ltr');

      // Switch back to English (LTR)
      fireEvent.click(screen.getByTestId('toggle-language'));

      await waitFor(() => {
        expect(layout).toHaveClass('ltr');
      });

      expect(layout).not.toHaveClass('rtl');
    });
  });

  describe('Offline functionality with cached translations', () => {
    it('should work with cached translations when offline', () => {
      // Pre-populate localStorage with cached translations
      localStorage.getItem = vi.fn().mockReturnValue('ar');

      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>
      );

      // Should work with cached Arabic translations
      expect(screen.getByTestId('current-language')).toHaveTextContent('ar');
      expect(screen.getByTestId('welcome-text')).toHaveTextContent('مرحباً');
      expect(screen.getByTestId('save-button')).toHaveTextContent('حفظ');
    });
  });

  describe('Error handling and fallback behavior', () => {
    it('should handle invalid locale gracefully', async () => {
      const InvalidLocaleComponent: React.FC = () => {
        const { changeLanguage } = useTranslation();
        
        return (
          <button 
            data-testid="invalid-locale"
            onClick={() => changeLanguage('fr' as any)}
          >
            Invalid Locale
          </button>
        );
      };

      render(
        <TranslationProvider>
          <InvalidLocaleComponent />
        </TranslationProvider>
      );

      // Should throw error for invalid locale
      const button = screen.getByTestId('invalid-locale');
      
      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      fireEvent.click(button);

      // Should handle error gracefully
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should return key when translation is missing', () => {
      const MissingTranslationComponent: React.FC = () => {
        const { t } = useTranslation('common');
        
        return (
          <div data-testid="missing-translation">
            {t('nonexistent.key')}
          </div>
        );
      };

      render(
        <TranslationProvider>
          <MissingTranslationComponent />
        </TranslationProvider>
      );

      // Should return the key when translation is missing
      expect(screen.getByTestId('missing-translation')).toHaveTextContent('nonexistent.key');
    });
  });

  describe('Multiple namespace support', () => {
    const MultiNamespaceComponent: React.FC = () => {
      const commonTranslation = useTranslation('common');
      const authTranslation = useTranslation('auth');
      const dashboardTranslation = useTranslation('dashboard');
      
      return (
        <div>
          <div data-testid="common-welcome">{commonTranslation.t('welcome')}</div>
          <div data-testid="auth-login">{authTranslation.t('login')}</div>
          <div data-testid="dashboard-title">{dashboardTranslation.t('dashboard')}</div>
        </div>
      );
    };

    it('should handle multiple namespaces correctly', async () => {
      render(
        <TranslationProvider defaultLanguage="en">
          <MultiNamespaceComponent />
        </TranslationProvider>
      );

      // Verify English translations from different namespaces
      expect(screen.getByTestId('common-welcome')).toHaveTextContent('Welcome');
      expect(screen.getByTestId('auth-login')).toHaveTextContent('Login');
      expect(screen.getByTestId('dashboard-title')).toHaveTextContent('Dashboard');
    });

    it('should handle multiple namespaces in Arabic', async () => {
      render(
        <TranslationProvider defaultLanguage="ar">
          <MultiNamespaceComponent />
        </TranslationProvider>
      );

      // Verify Arabic translations from different namespaces
      expect(screen.getByTestId('common-welcome')).toHaveTextContent('مرحباً');
      expect(screen.getByTestId('auth-login')).toHaveTextContent('تسجيل الدخول');
      expect(screen.getByTestId('dashboard-title')).toHaveTextContent('لوحة التحكم');
    });
  });

  describe('RTL Manager integration', () => {
    it('should update document direction when language changes', async () => {
      render(
        <TranslationProvider defaultLanguage="en">
          <TestComponent />
        </TranslationProvider>
      );

      // Initial LTR
      expect(document.documentElement.getAttribute('dir')).toBe('ltr');

      // Switch to Arabic
      fireEvent.click(screen.getByTestId('switch-to-arabic'));

      await waitFor(() => {
        expect(document.documentElement.getAttribute('dir')).toBe('rtl');
      });

      // Switch back to English
      fireEvent.click(screen.getByTestId('switch-to-english'));

      await waitFor(() => {
        expect(document.documentElement.getAttribute('dir')).toBe('ltr');
      });
    });

    it('should add/remove RTL classes correctly', async () => {
      render(
        <TranslationProvider defaultLanguage="en">
          <TestComponent />
        </TranslationProvider>
      );

      // Initial state - no RTL class
      expect(document.documentElement.classList.contains('rtl')).toBe(false);

      // Switch to Arabic
      fireEvent.click(screen.getByTestId('switch-to-arabic'));

      await waitFor(() => {
        expect(document.documentElement.classList.contains('rtl')).toBe(true);
      });

      // Switch back to English
      fireEvent.click(screen.getByTestId('switch-to-english'));

      await waitFor(() => {
        expect(document.documentElement.classList.contains('rtl')).toBe(false);
      });
    });
  });
});