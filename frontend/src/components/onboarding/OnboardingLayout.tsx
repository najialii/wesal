import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/translation';
import { SimpleLanguageToggle } from '../SimpleLanguageToggle';
import { 
  ChartBarIcon, 
  ShieldCheckIcon, 
  CubeIcon, 
  UserGroupIcon,
  ClockIcon,
  BoltIcon,
  GlobeAltIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children }) => {
  const { isRTL } = useTranslation();
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: ChartBarIcon,
      title: isRTL ? 'تحليلات متقدمة' : 'Advanced Analytics',
      description: isRTL 
        ? 'احصل على رؤى عميقة حول أداء عملك مع لوحات تحكم تفاعلية وتقارير شاملة'
        : 'Get deep insights into your business performance with interactive dashboards and comprehensive reports',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: UserGroupIcon,
      title: isRTL ? 'إدارة الفريق' : 'Team Management',
      description: isRTL
        ? 'قم بإدارة فريقك بكفاءة مع أدوار وصلاحيات مخصصة لكل عضو'
        : 'Manage your team efficiently with custom roles and permissions for each member',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: CubeIcon,
      title: isRTL ? 'إدارة المخزون' : 'Inventory Management',
      description: isRTL
        ? 'تتبع مخزونك في الوقت الفعلي مع تنبيهات ذكية وإدارة متعددة الفروع'
        : 'Track your inventory in real-time with smart alerts and multi-branch management',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: BoltIcon,
      title: isRTL ? 'أتمتة ذكية' : 'Smart Automation',
      description: isRTL
        ? 'وفر الوقت مع الأتمتة الذكية للمهام المتكررة والعمليات اليومية'
        : 'Save time with smart automation of repetitive tasks and daily operations',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: ShieldCheckIcon,
      title: isRTL ? 'أمان متقدم' : 'Advanced Security',
      description: isRTL
        ? 'حماية بياناتك مع تشفير من الدرجة المصرفية ونسخ احتياطي تلقائي'
        : 'Protect your data with bank-grade encryption and automatic backups',
      color: 'from-blue-500 to-blue-500',
    },
    {
      icon: GlobeAltIcon,
      title: isRTL ? 'دعم متعدد اللغات' : 'Multi-language Support',
      description: isRTL
        ? 'واجهة كاملة بالعربية والإنجليزية مع دعم RTL متكامل'
        : 'Full Arabic and English interface with complete RTL support',
      color: 'from-teal-500 to-cyan-500',
    },
  ];

  // Auto-rotate features every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  const currentFeatureData = features[currentFeature];

  return (
    <div 
      className="min-h-screen flex"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Left Side - Features Showcase (Always on left in LTR, right in RTL) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid-white/[0.2]" />
        </div>

        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
              <img src="/1.svg" alt="WesalTech" className="w-9 h-9" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">WesalTech</h1>
              <p className="text-sm text-white/80">
                {isRTL ? 'منصة إدارة الأعمال' : 'Business Management Platform'}
              </p>
            </div>
          </div>

          {/* Feature Showcase - Animated */}
          <div className="space-y-8">
            {/* Main Feature Card */}
            <div 
              key={currentFeature}
              className="animate-fade-in-up"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className={`w-16 h-16 bg-gradient-to-br ${currentFeatureData.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                  <currentFeatureData.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4">{currentFeatureData.title}</h3>
                <p className="text-lg text-white/90 leading-relaxed">
                  {currentFeatureData.description}
                </p>
              </div>
            </div>

            {/* Feature Indicators */}
            <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentFeature
                      ? 'w-12 h-3 bg-white'
                      : 'w-3 h-3 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Feature ${index + 1}`}
                />
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">500+</div>
                <div className="text-sm text-white/70">{isRTL ? 'عميل نشط' : 'Active Clients'}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">99.9%</div>
                <div className="text-sm text-white/70">{isRTL ? 'وقت التشغيل' : 'Uptime'}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">24/7</div>
                <div className="text-sm text-white/70">{isRTL ? 'الدعم' : 'Support'}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/70">
              © 2024 WesalTech. {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
            </p>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <SparklesIcon className="w-5 h-5 text-white/70" />
              <span className="text-sm text-white/70">{isRTL ? 'مدعوم بالذكاء الاصطناعي' : 'AI Powered'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

        {/* Language Toggle */}
        <div className={`absolute top-6 z-50 ${isRTL ? 'left-6' : 'right-6'}`}>
          <SimpleLanguageToggle variant="button" size="sm" />
        </div>

        {/* Scrollable Form Area */}
        <div className="relative z-10 flex-1 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-6 sm:p-8 lg:p-12">
            <div className="w-full max-w-2xl">
              {/* Mobile Logo (visible only on mobile) */}
              <div className="lg:hidden mb-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <img src="/1.svg" alt="WesalTech" className="w-10 h-10" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {isRTL ? 'مرحباً بك في WesalTech' : 'Welcome to WesalTech'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {isRTL ? 'دعنا نبدأ بإعداد حسابك' : "Let's get your account set up"}
                </p>
              </div>

              {/* Welcome Badge */}
              <div className="mb-8 flex justify-center">
                <div className="inline-flex items-center space-x-2 rtl:space-x-reverse bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
                  <ClockIcon className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {isRTL ? 'خطوة واحدة فقط للبدء' : 'Just one step to get started'}
                  </span>
                </div>
              </div>

              {/* Form Card */}
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 sm:p-10">
                {children}
              </div>

              {/* Help Text */}
              <div className="mt-8 text-center space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isRTL 
                    ? 'يمكنك تخطي هذه الخطوة والبدء مباشرة' 
                    : 'You can skip this step and start right away'}
                </p>
                <div className="flex items-center justify-center space-x-6 rtl:space-x-reverse text-sm text-gray-500 dark:text-gray-400">
                  <a href="#" className="hover:text-primary-600 transition-colors font-medium">
                    {isRTL ? 'المساعدة' : 'Help Center'}
                  </a>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <a href="#" className="hover:text-primary-600 transition-colors font-medium">
                    {isRTL ? 'اتصل بنا' : 'Contact Us'}
                  </a>
                </div>
              </div>

              {/* Mobile Footer */}
              <div className="lg:hidden mt-8 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  © 2024 WesalTech. {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
