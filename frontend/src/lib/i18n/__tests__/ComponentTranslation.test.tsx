/**
 * Property-based tests for comprehensive component translation
 * Feature: comprehensive-i18n-system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import fc from 'fast-check';
import { TranslationProvider, useTranslation } from '../TranslationProvider';
import { Locale } from '../types';

// Test component that uses translations
const TestComponent: React.FC<{ 
  translationKeys: string[], 
  namespace?: string 
}> = ({ translationKeys, namespace = 'common' }) => {
  const { t, currentLanguage, changeLanguage } = useTranslation(namespace);
  
  return (
    <div data-testid="test-component">
      <div data-testid="current-language">{currentLanguage}</div>
      <button 
        data-testid="change-to-arabic" 
        onClick={() => changeLanguage('ar')}
      >
        Change to Arabic
      </button>
      <button 
        data-testid="change-to-english" 
        onClick={() => changeLanguage('en')}
      >
        Change to English
      </button>
      {translationKeys.map((key, index) => (
        <div key={index} data-testid={`translation-${index}`}>
          {t(key)}
        </div>
      ))}
    </div>
  );
};

// Form component test
const TestFormComponent: React.FC = () => {
  const { t } = useTranslation('auth');
  
  return (
    <form data-testid="test-form">
      <label data-testid="email-label">{t('email')}</label>
      <input 
        data-testid="email-input" 
        placeholder={t('email')} 
        type="email" 
      />
      
      <label data-testid="password-label">{t('password')}</label>
      <input 
        data-testid="password-input" 
        placeholder={t('password')} 
        type="password" 
      />
      
      <button data-testid="login-button" type="submit">
        {t('login')}
      </button>
    </form>
  );
};

// Navigation component test
const TestNavigationComponent: React.FC = () => {
  const { t } = useTranslation('dashboard');
  
  return (
    <nav data-testid="test-navigation">
      <a data-testid="dashboard-link">{t('dashboard')}</a>
      <a data-testid="overview-link">{t('overview')}</a>
      <a data-testid="statistics-link">{t('statistics')}</a>
    </nav>
  );
};

// Helper to render component with provider
const renderWithProvider = (
  component: React.ReactElement, 
  defaultLanguage: Locale = 'en'
) => {
  return render(
    <TranslationProvider defaultLanguage={defaultLanguage}>
      {component}
    </TranslationProvider>
  );
};

describe('Comprehensive Component Translation Property Tests', () => {
  /**
   * **Feature: comprehensive-i18n-system, Property 7: Comprehensive component translation**
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
   */
  it('should translate all text elements when language changes', async () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('welcome', 'hello', 'goodbye', 'yes', 'no'), { minLength: 1, maxLength: 5 }),
        async (translationKeys) => {
          renderWithProvider(
            <TestComponent translationKeys={translationKeys} />
          );
          
          // Initially should be in English
          expect(screen.getByTestId('current-language')).toHaveTextContent('en');
          
          // Check initial English translations
          translationKeys.forEach((key, index) => {
            const element = screen.getByTestId(`translation-${index}`);
            expect(element.textContent).toBeTruthy();
            expect(element.textContent).not.toBe(key); // Should not display the key
          });
          
          // Change to Arabic
          fireEvent.click(screen.getByTestId('change-to-arabic'));
          
          await waitFor(() => {
            expect(screen.getByTestId('current-language')).toHaveTextContent('ar');
          });
          
          // Check Arabic translations
          translationKeys.forEach((key, index) => {
            const element = screen.getByTestId(`translation-${index}`);
            expect(element.textContent).toBeTruthy();
            expect(element.textContent).not.toBe(key); // Should not display the key
          });
          
          // Change back to English
          fireEvent.click(screen.getByTestId('change-to-english'));
          
          await waitFor(() => {
            expect(screen.getByTestId('current-language')).toHaveTextContent('en');
          });
          
          // Verify English translations are restored
          translationKeys.forEach((key, index) => {
            const element = screen.getByTestId(`translation-${index}`);
            expect(element.textContent).toBeTruthy();
            expect(element.textContent).not.toBe(key); // Should not display the key
          });
        }
      ),
      { numRuns: 20 } // Reduced runs for UI tests
    );
  });

  /**
   * **Feature: comprehensive-i18n-system, Property 7: Comprehensive component translation**
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
   */
  it('should translate form elements including labels, placeholders, and buttons', () => {
    // Test English form
    renderWithProvider(<TestFormComponent />);
    
    // Check English form elements
    expect(screen.getByTestId('email-label')).toHaveTextContent('Email');
    expect(screen.getByTestId('password-label')).toHaveTextContent('Password');
    expect(screen.getByTestId('login-button')).toHaveTextContent('Login');
    
    const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
    
    expect(emailInput.placeholder).toBe('Email');
    expect(passwordInput.placeholder).toBe('Password');
  });

  it('should translate form elements in Arabic', () => {
    // Test Arabic form
    renderWithProvider(<TestFormComponent />, 'ar');
    
    // Check Arabic form elements
    expect(screen.getByTestId('email-label')).toHaveTextContent('البريد الإلكتروني');
    expect(screen.getByTestId('password-label')).toHaveTextContent('كلمة المرور');
    expect(screen.getByTestId('login-button')).toHaveTextContent('تسجيل الدخول');
    
    const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
    
    expect(emailInput.placeholder).toBe('البريد الإلكتروني');
    expect(passwordInput.placeholder).toBe('كلمة المرور');
  });

  /**
   * **Feature: comprehensive-i18n-system, Property 7: Comprehensive component translation**
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
   */
  it('should translate navigation elements correctly', () => {
    // Test English navigation
    renderWithProvider(<TestNavigationComponent />);
    
    expect(screen.getByTestId('dashboard-link')).toHaveTextContent('Dashboard');
    expect(screen.getByTestId('overview-link')).toHaveTextContent('Overview');
    expect(screen.getByTestId('statistics-link')).toHaveTextContent('Statistics');
  });

  it('should translate navigation elements in Arabic', () => {
    // Test Arabic navigation
    renderWithProvider(<TestNavigationComponent />, 'ar');
    
    expect(screen.getByTestId('dashboard-link')).toHaveTextContent('لوحة التحكم');
    expect(screen.getByTestId('overview-link')).toHaveTextContent('نظرة عامة');
    expect(screen.getByTestId('statistics-link')).toHaveTextContent('الإحصائيات');
  });

  /**
   * **Feature: comprehensive-i18n-system, Property 7: Comprehensive component translation**
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
   */
  it('should handle missing translations by displaying keys', () => {
    const TestMissingTranslationComponent: React.FC = () => {
      const { t } = useTranslation();
      
      return (
        <div data-testid="missing-translation-component">
          <div data-testid="missing-key">{t('non_existent_key')}</div>
          <div data-testid="another-missing-key">{t('another_missing_key')}</div>
        </div>
      );
    };

    renderWithProvider(<TestMissingTranslationComponent />);
    
    // Should display the key when translation is missing
    expect(screen.getByTestId('missing-key')).toHaveTextContent('non_existent_key');
    expect(screen.getByTestId('another-missing-key')).toHaveTextContent('another_missing_key');
  });

  /**
   * **Feature: comprehensive-i18n-system, Property 7: Comprehensive component translation**
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
   */
  it('should maintain translation consistency across multiple component instances', () => {
    const MultipleInstanceComponent: React.FC = () => {
      const { t, changeLanguage } = useTranslation();
      
      return (
        <div data-testid="multiple-instances">
          <button 
            data-testid="change-language" 
            onClick={() => changeLanguage('ar')}
          >
            Change Language
          </button>
          <div data-testid="instance-1">{t('welcome')}</div>
          <div data-testid="instance-2">{t('welcome')}</div>
          <div data-testid="instance-3">{t('welcome')}</div>
        </div>
      );
    };

    renderWithProvider(<MultipleInstanceComponent />);
    
    // All instances should show the same translation initially
    const instance1 = screen.getByTestId('instance-1');
    const instance2 = screen.getByTestId('instance-2');
    const instance3 = screen.getByTestId('instance-3');
    
    expect(instance1.textContent).toBe('Welcome');
    expect(instance2.textContent).toBe('Welcome');
    expect(instance3.textContent).toBe('Welcome');
    
    // Change language
    fireEvent.click(screen.getByTestId('change-language'));
    
    // All instances should update consistently
    waitFor(() => {
      expect(instance1.textContent).toBe('مرحباً');
      expect(instance2.textContent).toBe('مرحباً');
      expect(instance3.textContent).toBe('مرحباً');
    });
  });

  it('should handle different namespaces correctly', () => {
    const MultiNamespaceComponent: React.FC = () => {
      const commonT = useTranslation('common').t;
      const authT = useTranslation('auth').t;
      const dashboardT = useTranslation('dashboard').t;
      
      return (
        <div data-testid="multi-namespace">
          <div data-testid="common-welcome">{commonT('welcome')}</div>
          <div data-testid="auth-login">{authT('login')}</div>
          <div data-testid="dashboard-overview">{dashboardT('overview')}</div>
        </div>
      );
    };

    renderWithProvider(<MultiNamespaceComponent />);
    
    expect(screen.getByTestId('common-welcome')).toHaveTextContent('Welcome');
    expect(screen.getByTestId('auth-login')).toHaveTextContent('Login');
    expect(screen.getByTestId('dashboard-overview')).toHaveTextContent('Overview');
  });

  it('should handle rapid language changes without errors', async () => {
    const RapidChangeComponent: React.FC = () => {
      const { t, changeLanguage, currentLanguage } = useTranslation();
      
      return (
        <div data-testid="rapid-change">
          <div data-testid="current-lang">{currentLanguage}</div>
          <div data-testid="welcome-text">{t('welcome')}</div>
          <button 
            data-testid="rapid-ar" 
            onClick={() => changeLanguage('ar')}
          >
            AR
          </button>
          <button 
            data-testid="rapid-en" 
            onClick={() => changeLanguage('en')}
          >
            EN
          </button>
        </div>
      );
    };

    renderWithProvider(<RapidChangeComponent />);
    
    // Rapidly change languages
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByTestId('rapid-ar'));
      fireEvent.click(screen.getByTestId('rapid-en'));
    }
    
    // Should not throw errors and should end up in a consistent state
    await waitFor(() => {
      const currentLang = screen.getByTestId('current-lang').textContent;
      const welcomeText = screen.getByTestId('welcome-text').textContent;
      
      if (currentLang === 'en') {
        expect(welcomeText).toBe('Welcome');
      } else if (currentLang === 'ar') {
        expect(welcomeText).toBe('مرحباً');
      }
    });
  });
});