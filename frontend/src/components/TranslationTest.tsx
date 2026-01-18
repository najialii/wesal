import React, { useEffect, useState } from 'react';
import { useTranslation } from '../lib/i18n/TranslationProvider';

export const TranslationTest: React.FC = () => {
  const { t, currentLanguage, changeLanguage, loading } = useTranslation('common');
  const [debugInfo, setDebugInfo] = useState({
    currentLanguage: '',
    localStorage: '',
    timestamp: '',
  });

  // Update debug info every second
  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        currentLanguage: currentLanguage,
        localStorage: localStorage.getItem('i18n_language') || 'Not set',
        timestamp: new Date().toLocaleTimeString(),
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [currentLanguage]);

  const handleLanguageChange = async (locale: string) => {
    console.log(`=== CHANGING LANGUAGE TO ${locale} ===`);
    
    try {
      await changeLanguage(locale as 'ar' | 'en');
      console.log(`Language changed to: ${locale}`);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const clearCache = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Translation Test</h3>
      
      <div className="space-y-2 text-sm">
        <div><strong>Context Language:</strong> {currentLanguage}</div>
        <div><strong>localStorage:</strong> {debugInfo.localStorage}</div>
        <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
        <div><strong>Last Update:</strong> {debugInfo.timestamp}</div>
      </div>

      <div className="mt-4 space-y-2">
        <div><strong>Translation Tests:</strong></div>
        <div>Dashboard: "{t('dashboard')}"</div>
        <div>Products: "{t('products')}"</div>
        <div>Save Button: "{t('save')}"</div>
        <div>Welcome Message: "{t('welcome')}"</div>
      </div>

      <div className="mt-4 space-x-2">
        <button
          onClick={() => handleLanguageChange('en')}
          className="px-3 py-1 bg-blue-500 text-white rounded"
          disabled={loading}
        >
          English
        </button>
        <button
          onClick={() => handleLanguageChange('ar')}
          className="px-3 py-1 bg-green-500 text-white rounded"
          disabled={loading}
        >
          العربية
        </button>
        <button
          onClick={clearCache}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          Clear Cache
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-white rounded border">
        <div><strong>Font Test:</strong></div>
        <div className="text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          {currentLanguage === 'ar' ? 'هذا نص باللغة العربية' : 'This is English text'}
        </div>
      </div>
    </div>
  );
};