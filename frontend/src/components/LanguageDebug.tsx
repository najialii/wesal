import React, { useEffect, useState } from 'react';
import { useTranslation, useRTL, useLanguagePreference } from '../lib/translation';

export const LanguageDebug: React.FC = () => {
  const { currentLanguage, changeLanguage, loading, error } = useLanguagePreference();
  const { isRTL } = useRTL();
  const { t } = useTranslation('common');
  const [docInfo, setDocInfo] = useState({
    dir: '',
    lang: '',
    classes: '',
  });

  // Update document info when direction changes
  useEffect(() => {
    const updateDocInfo = () => {
      setDocInfo({
        dir: document.documentElement.getAttribute('dir') || '',
        lang: document.documentElement.getAttribute('lang') || '',
        classes: document.documentElement.className,
      });
    };

    updateDocInfo();
    
    // Listen for direction changes
    const handleDirectionChange = () => updateDocInfo();
    window.addEventListener('directionchange', handleDirectionChange);
    
    return () => {
      window.removeEventListener('directionchange', handleDirectionChange);
    };
  }, [currentLanguage, isRTL]);

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Language Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div><strong>Current Language:</strong> {currentLanguage}</div>
        <div><strong>Is RTL:</strong> {isRTL ? 'Yes' : 'No'}</div>
        <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
        <div><strong>Error:</strong> {error || 'None'}</div>
        <div><strong>Document Dir:</strong> {docInfo.dir}</div>
        <div><strong>Document Lang:</strong> {docInfo.lang}</div>
        <div><strong>HTML Classes:</strong> {docInfo.classes}</div>
      </div>

      <div className="mt-4 space-y-2">
        <div><strong>Translation Test:</strong></div>
        <div>Dashboard: {t('navigation.dashboard')}</div>
        <div>Products: {t('navigation.products')}</div>
        <div>Save Button: {t('buttons.save')}</div>
      </div>

      <div className="mt-4 space-x-2">
        <button
          onClick={() => changeLanguage('en')}
          className="px-3 py-1 bg-blue-500 text-white rounded"
          disabled={loading}
        >
          Switch to English
        </button>
        <button
          onClick={() => changeLanguage('ar')}
          className="px-3 py-1 bg-green-500 text-white rounded"
          disabled={loading}
        >
          Switch to Arabic
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-white rounded border">
        <div><strong>RTL Test:</strong></div>
        <div className={`text-lg ${isRTL ? 'text-right' : 'text-left'}`}>
          {isRTL ? 'هذا نص باللغة العربية' : 'This is English text'}
        </div>
        <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 mt-2`}>
          <span className="px-2 py-1 bg-blue-100 rounded">First</span>
          <span className="px-2 py-1 bg-green-100 rounded">Second</span>
          <span className="px-2 py-1 bg-red-100 rounded">Third</span>
        </div>
      </div>
    </div>
  );
};