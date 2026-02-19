import { Link } from 'react-router-dom';
import { useState } from 'react';
import { SparklesIcon, CheckIcon, GlobeAltIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function Pricing() {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const isRTL = language === 'ar';

  const content = {
    en: {
      title: 'Simple, Transparent Pricing',
      subtitle: 'Choose the plan that fits your business needs',
      monthly: 'Monthly',
      annually: 'Annually',
      save: 'Save 20%',
      plans: [
        {
          name: 'Starter',
          price: '299',
          period: '/month',
          description: 'Perfect for small businesses getting started',
          features: [
            '1 Branch',
            'Up to 5 Users',
            'POS System',
            'Basic Inventory',
            'Customer Management',
            'Email Support',
            '5GB Storage'
          ],
          cta: 'Start Free Trial',
          popular: false
        },
        {
          name: 'Professional',
          price: '699',
          period: '/month',
          description: 'For growing businesses with multiple locations',
          features: [
            'Up to 5 Branches',
            'Up to 20 Users',
            'Advanced POS',
            'Multi-branch Inventory',
            'Maintenance Scheduling',
            'Analytics & Reports',
            'Priority Support',
            '50GB Storage',
            'Mobile App Access'
          ],
          cta: 'Start Free Trial',
          popular: true
        },
        {
          name: 'Enterprise',
          price: 'Custom',
          period: '',
          description: 'For large organizations with custom needs',
          features: [
            'Unlimited Branches',
            'Unlimited Users',
            'Full Feature Access',
            'Custom Integrations',
            'Dedicated Account Manager',
            '24/7 Phone Support',
            'Unlimited Storage',
            'Custom Training',
            'SLA Guarantee'
          ],
          cta: 'Contact Sales',
          popular: false
        }
      ],
      faq: {
        title: 'Frequently Asked Questions',
        items: [
          {
            q: 'Can I try before I buy?',
            a: 'Yes! We offer a 7-day free trial with full access to all features. No credit card required.'
          },
          {
            q: 'Can I change plans later?',
            a: 'Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
          },
          {
            q: 'What payment methods do you accept?',
            a: 'We accept all major credit cards, bank transfers, and Saudi payment methods including Mada and STC Pay.'
          },
          {
            q: 'Is there a setup fee?',
            a: 'No setup fees. You only pay for your chosen plan. We also provide free onboarding assistance.'
          }
        ]
      }
    },
    ar: {
      title: 'أسعار بسيطة وشفافة',
      subtitle: 'اختر الباقة التي تناسب احتياجات عملك',
      monthly: 'شهري',
      annually: 'سنوي',
      save: 'وفر 20%',
      plans: [
        {
          name: 'المبتدئ',
          price: '299',
          period: '/شهرياً',
          description: 'مثالي للشركات الصغيرة التي تبدأ',
          features: [
            'فرع واحد',
            'حتى 5 مستخدمين',
            'نظام نقاط البيع',
            'مخزون أساسي',
            'إدارة العملاء',
            'دعم عبر البريد الإلكتروني',
            'مساحة تخزين 5 جيجابايت'
          ],
          cta: 'ابدأ التجربة المجانية',
          popular: false
        },
        {
          name: 'المحترف',
          price: '699',
          period: '/شهرياً',
          description: 'للشركات النامية ذات المواقع المتعددة',
          features: [
            'حتى 5 فروع',
            'حتى 20 مستخدم',
            'نقاط بيع متقدمة',
            'مخزون متعدد الفروع',
            'جدولة الصيانة',
            'التحليلات والتقارير',
            'دعم ذو أولوية',
            'مساحة تخزين 50 جيجابايت',
            'الوصول عبر التطبيق'
          ],
          cta: 'ابدأ التجربة المجانية',
          popular: true
        },
        {
          name: 'المؤسسات',
          price: 'مخصص',
          period: '',
          description: 'للمؤسسات الكبيرة ذات الاحتياجات المخصصة',
          features: [
            'فروع غير محدودة',
            'مستخدمون غير محدودون',
            'الوصول الكامل للميزات',
            'تكاملات مخصصة',
            'مدير حساب مخصص',
            'دعم هاتفي على مدار الساعة',
            'تخزين غير محدود',
            'تدريب مخصص',
            'ضمان اتفاقية مستوى الخدمة'
          ],
          cta: 'اتصل بالمبيعات',
          popular: false
        }
      ],
      faq: {
        title: 'الأسئلة الشائعة',
        items: [
          {
            q: 'هل يمكنني التجربة قبل الشراء؟',
            a: 'نعم! نقدم تجربة مجانية لمدة 7 أيام مع وصول كامل لجميع الميزات. لا حاجة لبطاقة ائتمان.'
          },
          {
            q: 'هل يمكنني تغيير الباقة لاحقاً؟',
            a: 'بالتأكيد. يمكنك الترقية أو التخفيض في أي وقت. تسري التغييرات على الفور.'
          },
          {
            q: 'ما هي طرق الدفع المقبولة؟',
            a: 'نقبل جميع بطاقات الائتمان الرئيسية والتحويلات البنكية وطرق الدفع السعودية بما في ذلك مدى وSTC Pay.'
          },
          {
            q: 'هل هناك رسوم إعداد؟',
            a: 'لا توجد رسوم إعداد. تدفع فقط مقابل الباقة المختارة. نقدم أيضاً مساعدة مجانية في الإعداد.'
          }
        ]
      }
    }
  };

  const t = content[language];

  return (
    <div className={`min-h-screen bg-white ${isRTL ? 'font-tajawal' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">وصال<span className="text-blue-600">تك</span></span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/solutions" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">
                {language === 'en' ? 'Solutions' : 'الحلول'}
              </Link>
              <Link to="/pricing" className="text-sm font-semibold text-blue-600">
                {language === 'en' ? 'Pricing' : 'الأسعار'}
              </Link>
              <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">
                {language === 'en' ? 'About Us' : 'من نحن'}
              </Link>
              <Link to="/contact" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">
                {language === 'en' ? 'Contact' : 'اتصل بنا'}
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition text-sm text-gray-700"
              >
                <GlobeAltIcon className="w-4 h-4" />
                {language === 'en' ? 'العربية' : 'EN'}
              </button>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">
                {language === 'en' ? 'Sign In' : 'تسجيل الدخول'}
              </Link>
              <Link to="/register" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm">
                {language === 'en' ? 'Get Started' : 'ابدأ الآن'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">{t.title}</h1>
          <p className="text-xl text-gray-600">{t.subtitle}</p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {t.plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white border-2 rounded-2xl p-8 ${
                  plan.popular ? 'border-blue-600 shadow-2xl scale-105' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      {language === 'en' ? 'Most Popular' : 'الأكثر شعبية'}
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-600">{plan.period}</span>}
                </div>
                <Link
                  to={plan.price === 'Custom' || plan.price === 'مخصص' ? '/contact' : '/register'}
                  className={`block w-full py-3 rounded-lg font-semibold text-center transition mb-8 ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">{t.faq.title}</h2>
          <div className="space-y-6">
            {t.faq.items.map((item, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-2">{item.q}</h4>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            {language === 'en' ? 'Start Your Free Trial Today' : 'ابدأ تجربتك المجانية اليوم'}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {language === 'en' ? 'No credit card required. Cancel anytime.' : 'لا حاجة لبطاقة ائتمان. إلغاء في أي وقت.'}
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-semibold text-lg transition shadow-lg">
            {language === 'en' ? 'Get Started Free' : 'ابدأ مجاناً'}
            <ArrowRightIcon className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600">
          © 2026 WesalTech. {language === 'en' ? 'All rights reserved.' : 'جميع الحقوق محفوظة.'}
        </div>
      </footer>
    </div>
  );
}
