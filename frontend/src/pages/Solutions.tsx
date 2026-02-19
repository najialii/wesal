import { Link } from 'react-router-dom';
import { useState } from 'react';
import { 
  SparklesIcon,
  CubeIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  CloudIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function Solutions() {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const isRTL = language === 'ar';

  const content = {
    en: {
      title: 'COMPLETE SOLUTIONS',
      subtitle: 'The full-stack ecosystem for technical enterprise management.',
      solutions: [
        {
          title: 'Technical POS',
          description: 'Comprehensive point-of-sale solution designed specifically for technical services and component sales.',
          features: [
            'Quick invoicing for labor & parts',
            'Multi-branch inventory control',
            'VAT-compliant fiscal receipts',
            'Customer credit & history tracking',
            'Real-time stock synchronization',
            'Advanced barcode integration'
          ]
        },
        {
          title: 'Smart Dispatch',
          description: 'Visual calendar system for managing complex maintenance contracts and technician workflows.',
          features: [
            'Drag-and-drop job scheduling',
            'Automated field visit reminders',
            'Live technician status tracking',
            'Contract renewal automation',
            'Native mobile app for field staff',
            'Dedicated customer portal'
          ]
        },
        {
          title: 'Business Intelligence',
          description: 'Powerful analytical insights to help you make aggressive, data-driven growth decisions.',
          features: [
            'Margin & profitability analysis',
            'Branch performance benchmarks',
            'Technician efficiency metrics',
            'Inventory turnover velocity',
            'Customer satisfaction auditing',
            'Custom automated report builder'
          ]
        }
      ],
      additionalFeatures: {
        title: 'Enterprise-Grade Infrastructure',
        items: [
          { icon: ClockIcon, title: '24/7 Access', description: 'Cloud-first system accessible on any network' },
          { icon: ShieldCheckIcon, title: 'ZATCA Compliant', description: 'Bank-level security meeting Saudi regulations' },
          { icon: CloudIcon, title: 'Auto Backups', description: 'Redundant daily backups with 99.9% uptime' },
          { icon: DevicePhoneMobileIcon, title: 'Device Agnostic', description: 'Optimized for mobile, tablet, and desktop' }
        ]
      },
      cta: {
        title: 'Ready to scale your operations?',
        subtitle: 'Join hundreds of technical agencies already optimizing with Wesal.',
        button: 'Start Free Trial'
      }
    },
    ar: {
      title: 'حلول متكاملة',
      subtitle: 'المنظومة التقنية الشاملة لإدارة المؤسسات الفنية والتقنية.',
      solutions: [
        {
          title: 'نقاط البيع التقنية',
          description: 'حل شامل لنقاط البيع مصمم خصيصاً للخدمات الفنية ومبيعات المكونات.',
          features: [
            'فوترة سريعة للعمالة وقطع الغيار',
            'تحكم في المخزون متعدد الفروع',
            'إيصالات ضريبية متوافقة مع "زكاة"',
            'تتبع ائتمان وتاريخ العملاء',
            'مزامنة المخزون في الوقت الفعلي',
            'تكامل متطور مع الباركود'
          ]
        },
        {
          title: 'الجدولة الذكية',
          description: 'نظام تقويم مرئي لإدارة عقود الصيانة المعقدة وتدفقات عمل الفنيين.',
          features: [
            'جدولة المهام بالسحب والإفلات',
            'تذكيرات تلقائية للزيارات الميدانية',
            'تتبع حالة الفنيين مباشرة',
            'أتمتة تجديد عقود الصيانة',
            'تطبيق أصيل للفنيين الميدانيين',
            'بوابة مخصصة للعملاء'
          ]
        },
        {
          title: 'ذكاء الأعمال',
          description: 'رؤى تحليلية قوية لمساعدتك على اتخاذ قرارات نمو جريئة بناءً على البيانات.',
          features: [
            'تحليل الهوامش والربحية',
            'مقارنة أداء الفروع المختلفة',
            'مقاييس كفاءة وإنتاجية الفنيين',
            'سرعة دوران المخزون',
            'تدقيق مستويات رضا العملاء',
            'منشئ تقارير تلقائية مخصص'
          ]
        }
      ],
      additionalFeatures: {
        title: 'بنية تحتية بمستوى المؤسسات',
        items: [
          { icon: ClockIcon, title: 'وصول 24/7', description: 'نظام سحابي متاح على أي شبكة' },
          { icon: ShieldCheckIcon, title: 'متوافق مع هيئة الزكاة', description: 'أمان بنكي متوافق مع اللوائح السعودية' },
          { icon: CloudIcon, title: 'نسخ احتياطي', description: 'نسخ احتياطي يومي مع تشغيل 99.9%' },
          { icon: DevicePhoneMobileIcon, title: 'متعدد الأجهزة', description: 'محسن للجوال والتابلت والكمبيوتر' }
        ]
      },
      cta: {
        title: 'هل أنت مستعد لتوسيع عملياتك؟',
        subtitle: 'انضم إلى مئات الوكالات التقنية التي تزيد كفاءتها مع وصال.',
        button: 'ابدأ التجربة المجانية'
      }
    }
  };

  const t = content[language];

  return (
    <div className={`min-h-screen bg-white text-slate-800 ${isRTL ? 'font-tajawal' : 'font-sans'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white border-b-2 border-slate-100 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">{isRTL ? 'وصالتك' : 'WESALTECH'}</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">Home</Link>
            <Link to="/solutions" className="text-sm font-bold text-blue-600">Solutions</Link>
            <Link to="/pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">Pricing</Link>
          </div>
          <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="p-2 rounded-full hover:bg-slate-100 transition">
            <GlobeAltIcon className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 bg-slate-900 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black mb-6 italic uppercase tracking-tighter">{t.title}</h1>
          <p className="text-xl md:text-2xl text-blue-400 font-bold max-w-2xl mx-auto leading-relaxed">{t.subtitle}</p>
        </div>
      </section>

      {/* Main Solutions - High Impact Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {t.solutions.map((solution, index) => (
            <div key={index} className="group bg-white border-2 border-slate-100 rounded-[2rem] p-8 hover:border-blue-600 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                {index === 0 && <CubeIcon className="w-8 h-8" />}
                {index === 1 && <CalendarIcon className="w-8 h-8" />}
                {index === 2 && <ChartBarIcon className="w-8 h-8" />}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase">{solution.title}</h3>
              <p className="text-slate-600 mb-8 font-medium leading-relaxed">{solution.description}</p>
              <ul className="space-y-4">
                {solution.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 group/item">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 shrink-0 group-hover/item:text-blue-600 transition-colors" />
                    <span className="text-sm font-bold text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Additional Features - Dark Mode Accent */}
      <section className="py-24 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-center text-slate-900 mb-16 uppercase italic">{t.additionalFeatures.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {t.additionalFeatures.items.map((item, index) => (
              <div key={index} className="bg-white border-b-4 border-blue-600 rounded-2xl p-8 shadow-sm">
                <div className="text-blue-600 mb-4">
                  <item.icon className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-2 uppercase">{item.title}</h4>
                <p className="text-sm text-slate-500 font-medium">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Gradient Blast */}
      <section className="py-24 px-6 bg-blue-600 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white rounded-full blur-[120px]"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10 text-white">
          <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase italic tracking-tight">{t.cta.title}</h2>
          <p className="text-xl text-blue-100 mb-12 font-bold">{t.cta.subtitle}</p>
          <Link to="/register" className="inline-flex items-center gap-3 px-12 py-5 bg-white text-blue-600 hover:bg-slate-100 rounded-2xl font-black text-xl transition-all shadow-2xl hover:-translate-y-1">
            {t.cta.button}
            <ArrowRightIcon className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white text-center">
        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">© 2026 WESALTECH • Digital Infrastructure</p>
      </footer>
    </div>
  );
}