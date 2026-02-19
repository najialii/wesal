import React from 'react';
import { useTranslation, useDirectionClasses } from '@/lib/translation';
import { SimpleLanguageToggle } from '../SimpleLanguageToggle';
import { WrenchScrewdriverIcon, ShoppingCartIcon, CogIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface ModernOnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  stepDescription: string;
}

export const ModernOnboardingLayout: React.FC<ModernOnboardingLayoutProps> = ({
  children,
  currentStep,
  totalSteps,
  stepTitle,
  stepDescription,
}) => {
  const { currentLanguage } = useTranslation();
  const { isRTL } = useDirectionClasses();

  const steps = [
    { id: 1, name: isRTL ? 'معلومات العمل' : 'Business Info' },
    { id: 2, name: isRTL ? 'إنشاء فرع' : 'Create Branch' },
    { id: 3, name: isRTL ? 'أهلا وسهلا' : 'Welcome' },
    // { id: 4, name: isRTL ? 'إنشاء حساب' : 'Create Account' },
  ];

  return (
    <div 
      key={currentLanguage}
      className={`min-h-screen grid grid-cols-1 lg:grid-cols-2 ${isRTL ? 'font-tajawal' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Left Side - Gradient Background */}
      <div className="hidden lg:flex bg-gradient-to-br from-blue-600 to-white flex-col justify-center px-12 py-16 text-white relative overflow-hidden">
        {/* Floating icons */}
        <div className="absolute inset-0 opacity-30">
          <WrenchScrewdriverIcon className="absolute top-32 right-32 w-16 h-16 text-white" />
          <ShoppingCartIcon className="absolute top-60 left-16 w-14 h-14 text-white" />
          <CogIcon className="absolute bottom-40 right-16 w-20 h-20 text-white" />
          <ChartBarIcon className="absolute bottom-60 left-32 w-12 h-12 text-white" />
        </div>

        <div className="max-w-md relative z-10">
          <img src="/1.svg" alt="WesalTech" className="w-auto h-96 mb-8 filter brightness-0 invert" />
          {/* <h1 className="text-5xl font-bold mb-4 text-white">WesalTech</h1> */}
          <p className="text-xl mb-8 text-white/90">{currentLanguage === 'ar' ? 'إعداد منصة إدارة الأعمال الذكية' : 'Setting up Smart Business Management Platform'}</p>
          
          <div className="space-y-4 mb-8">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  step.id < currentStep
                    ? 'bg-green-500 text-white'
                    : step.id === currentStep
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white/70'
                }`}>
                  {step.id < currentStep ? '✓' : step.id}
                </div>
                <span className={`text-sm ${
                  step.id <= currentStep ? 'text-white' : 'text-white/70'
                }`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="text-white/90">{currentLanguage === 'ar' ? 'إعداد سريع وسهل' : 'Quick & Easy Setup'}</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="text-white/90">{currentLanguage === 'ar' ? 'دعم متكامل للصيانة والمبيعات' : 'Complete Maintenance & Sales Support'}</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="text-white/90">{currentLanguage === 'ar' ? 'ابدأ في دقائق معدودة' : 'Get Started in Minutes'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Content */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-12 bg-white">
        {/* Language Toggle */}
        <div className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'}`}>
          <SimpleLanguageToggle variant="button" size="sm" />
        </div>

        <div className="w-full max-w-2xl mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8 text-center">
            <img src="/1.svg" alt="WesalTech" className="w-16 h-14 mb-4 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">WesalTech</h1>
            
            {/* Mobile Progress */}
            <div className="mt-6 flex justify-center items-center">
              <div className="flex space-x-2 rtl:space-x-reverse">
                {steps.map((step) => (
                  <div key={step.id} className={`w-3 h-3 rounded-full transition-all ${
                    step.id <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                ))}
              </div>
              <span className="ml-4 rtl:mr-4 rtl:ml-0 text-sm text-gray-500">
                {currentStep} {isRTL ? 'من' : 'of'} {totalSteps}
              </span>
            </div>
          </div>

          {/* Step Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{stepTitle}</h2>
            <p className="text-gray-600">{stepDescription}</p>
          </div>

          {/* Main Content */}
          <div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};