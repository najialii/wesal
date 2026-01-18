/**
 * Simple test component to verify translation system is working
 */
import React from 'react';
import { TranslationProvider, useTranslation } from './lib/i18n/TranslationProvider';

const TestComponent: React.FC = () => {
  const { t, currentLanguage, changeLanguage } = useTranslation();

  return (
    <div>
      <h1>Translation Test</h1>
      <p>Current Language: {currentLanguage}</p>
      <p>Welcome: {t('welcome')}</p>
      <p>Hello: {t('hello')}</p>
      <button onClick={() => changeLanguage('ar')}>Switch to Arabic</button>
      <button onClick={() => changeLanguage('en')}>Switch to English</button>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <TranslationProvider defaultLanguage="en">
      <TestComponent />
    </TranslationProvider>
  );
};

export default App;