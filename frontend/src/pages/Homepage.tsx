import { Link } from 'react-router-dom';
import { useTranslation, useRTL } from '../lib/translation';

export default function Homepage() {
  const { t, changeLanguage, currentLanguage } = useTranslation();
  const { isRTL } = useRTL();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 ${isRTL ? 'font-tajawal' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="/1.svg" 
                alt="WesalTech Logo" 
                className="h-12 w-auto"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <button
                onClick={() => changeLanguage(currentLanguage === 'ar' ? 'en' : 'ar')}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {currentLanguage === 'ar' ? 'English' : 'العربية'}
              </button>
              
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {t('auth.login', { fallback: 'Login' })}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            {t('homepage.hero.title')}
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
            {t('homepage.hero.subtitle')}
          </p>
          
          <div className="mt-10 flex justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('homepage.cta.getStarted')}
            </Link>
            <button className="px-8 py-3 text-lg font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              {t('homepage.cta.learnMore')}
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('homepage.features.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('homepage.features.pos.title')}
              </h3>
              <p className="text-gray-600">
                {t('homepage.features.pos.description')}
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('homepage.features.inventory.title')}
              </h3>
              <p className="text-gray-600">
                {t('homepage.features.inventory.description')}
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('homepage.features.team.title')}
              </h3>
              <p className="text-gray-600">
                {t('homepage.features.team.description')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/1.svg" 
                alt="WesalTech Logo" 
                className="h-12 w-auto"
              />
            </div>
            <p className="text-gray-400 mb-8">
              {t('homepage.footer.tagline')}
            </p>
            <div className="flex justify-center space-x-6">
              <Link to="/login" className="text-gray-400 hover:text-white">
                {t('homepage.footer.login')}
              </Link>
              <span className="text-gray-600">|</span>
              <a href="#" className="text-gray-400 hover:text-white">
                {t('homepage.footer.contact')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}