import React from 'react';
import { useTranslation, useDirectionClasses } from '@/lib/translation';
import { SimpleLanguageToggle } from '../SimpleLanguageToggle';

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
    { id: 4, name: isRTL ? 'إنشاء حساب' : 'Create Account' },
  ];

  return (
    <div 
      key={currentLanguage}
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ${isRTL ? 'font-cairo' : 'font-inter'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        fontFamily: isRTL ? "'Cairo', 'Tajawal', sans-serif" : "'Inter', 'SF Pro Display', system-ui, sans-serif"
      }}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Language Toggle */}
      <div className={`absolute top-6 z-50 ${isRTL ? 'left-6' : 'right-6'}`}>
        <SimpleLanguageToggle variant="button" size="sm" />
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex">
        {/* Left Sidebar - Progress */}
        <div className="hidden lg:flex lg:w-80 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 sticky top-0 h-screen overflow-y-auto">
          <div className="flex flex-col justify-between p-8 w-full">
            {/* Logo */}
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <img src="/1.svg" alt="WesalTech" className="w-10 h-10" />
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex-1 py-12">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {stepTitle}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {stepDescription}
                  </p>
                </div>

                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                        step.id < currentStep
                          ? 'bg-green-500 text-white shadow-lg'
                          : step.id === currentStep
                          ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-600/20'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.id < currentStep ? '✓' : step.id}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          step.id <= currentStep
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {step.name}
                        </p>
                        {step.id === currentStep && (
                          <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <div className="bg-blue-600 h-1 rounded-full transition-all duration-500" style={{ width: '60%' }}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                © 2024 WesalTech. {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-2xl">
            {/* Mobile Header */}
            <div className="lg:hidden mb-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <img src="/1.svg" alt="WesalTech" className="w-10 h-10" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {stepTitle}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {stepDescription}
              </p>
              
              {/* Mobile Progress */}
              <div className="mt-6 flex justify-center">
                <div className="flex space-x-2 rtl:space-x-reverse">
                  {steps.map((step) => (
                    <div key={step.id} className={`w-3 h-3 rounded-full transition-all ${
                      step.id <= currentStep
                        ? 'bg-blue-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}></div>
                  ))}
                </div>
                <span className="ml-4 rtl:mr-4 rtl:ml-0 text-sm text-gray-500 dark:text-gray-400">
                  {currentStep} {isRTL ? 'من' : 'of'} {totalSteps}
                </span>
              </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 lg:p-12">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};