import { Link } from 'react-router-dom';
import { useState } from 'react';
import { 
  SparklesIcon, 
  ChartBarIcon, 
  CalendarIcon, 
  CubeIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

export default function Landing() {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const isRTL = language === 'ar';

  const content = {
    en: {
      hero: {
        title: 'WESAL',
        subtitle: 'Precision Management for Technical Enterprises',
        tagline: 'Integrated POS • Intelligent Scheduling • Operational Excellence',
        description: 'Wesal is a sophisticated cloud ecosystem engineered for small-to-medium technical businesses. We bridge the gap between complex technical operations and seamless financial management.',
        cta: 'Start 7-Day Free Trial',
        demo: 'Book a Discovery Tour'
      },
      kpis: [
        { value: '70%', label: 'Time Optimization' },
        { value: '30%', label: 'Cost Reduction' },
        { value: '24/7', label: 'Technical Synergy' },
        { value: '100%', label: 'Accuracy in POS' }
      ],
      features: [
        {
          title: 'Technical POS & Inventory',
          items: [
            'Precision Invoicing: Automated billing for labor and parts',
            'Inventory Intelligence: Real-time tracking of technical components',
            'Multi-branch stock management with transfer capabilities'
          ]
        },
        {
          title: 'Smart Scheduling',
          items: [
            'Visual Dispatch: Grid-based interface for technician workflows',
            'Real-Time Status: Monitor jobs from "Requested" to "Completed"',
            'Smart assignment based on technician availability'
          ]
        },
        {
          title: 'Analytics Dashboard',
          items: [
            'Profitability Maps: Insightful data on service margins',
            'Performance Audits: Track team efficiency with clarity',
            'Branch comparison and consolidated metrics'
          ]
        }
      ],
      sectors: [
        'IT & Technical Support',
        'Maintenance Agencies',
        'Specialized Repair Shops',
        'Multi-Branch Service Centers'
      ],
      testimonial: {
        quote: 'Wesal stripped away the complexity of our daily scheduling. It\'s the infrastructure we needed to maintain 90% execution speed.',
        author: 'The Space (Technical Partner)'
      }
    },
    ar: {
      hero: {
        title: 'وصال',
        subtitle: 'إدارة دقيقة للمؤسسات التقنية',
        tagline: 'نقاط بيع متكاملة • جدولة ذكية • تميز تشغيلي',
        description: 'وصال هي منظومة سحابية متطورة صُممت خصيصاً للمؤسسات التقنية والفنية المتوسطة والصغيرة. نحن نردم الفجوة بين العمليات التقنية المعقدة والإدارة المالية السلسة.',
        cta: 'ابدأ تجربة مجانية 7 أيام',
        demo: 'احجز جولة تعريفية'
      },
      kpis: [
        { value: '70%', label: 'توفير الوقت التشغيلي' },
        { value: '30%', label: 'خفض تكاليف الإدارة' },
        { value: '24/7', label: 'دعم فني متواصل' },
        { value: '100%', label: 'دقة متناهية في نقاط البيع' }
      ],
      features: [
        {
          title: 'نقاط البيع والمخزون',
          items: [
            'أتمتة الفواتير للعمالة وقطع الغيار',
            'تتبع حي للمخزون التقني والمكونات',
            'إدارة المخزون متعدد الفروع مع إمكانية النقل'
          ]
        },
        {
          title: 'الجدولة الذكية',
          items: [
            'واجهة شبكية لإدارة تدفق عمل الفنيين',
            'مراقبة حالة المهام لحظياً من البداية للنهاية',
            'تعيين ذكي بناءً على توفر الفنيين'
          ]
        },
        {
          title: 'لوحة التحليلات',
          items: [
            'بيانات دقيقة حول هوامش ربح الخدمات',
            'تقييم أداء الفرق بوضوح تام',
            'مقارنة الفروع ومقاييس موحدة'
          ]
        }
      ],
      sectors: [
        'تقنية المعلومات والدعم الفني',
        'وكالات الصيانة والتشغيل',
        'مراكز الإصلاح المتخصصة',
        'مراكز الخدمة متعددة الفروع'
      ],
      testimonial: {
        quote: 'وصال أزالت تعقيد جدولتنا اليومية. إنها البنية التحتية التي احتجناها للحفاظ على سرعة تنفيذ 90%.',
        author: 'ذا سبيس (شريك تقني)'
      }
    }
  };

  const t = content[language];

  return (
    <div className={`min-h-screen bg-white text-slate-800 ${isRTL ? 'font-tajawal' : 'font-sans'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white border-b border-slate-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">WESAL<span className="text-blue-600">TECH</span></span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/solutions" className="text-sm font-semibold text-slate-600 hover:text-blue-600">Solutions</Link>
              <Link to="/pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-600">Pricing</Link>
              <Link to="/about" className="text-sm font-semibold text-slate-600 hover:text-blue-600">About</Link>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="p-2 rounded-full hover:bg-slate-100 transition">
                <GlobeAltIcon className="w-5 h-5 text-slate-600" />
              </button>
              <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition">
                {t.hero.cta}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block py-1 px-3 bg-blue-50 text-blue-700 rounded font-bold text-xs uppercase tracking-wider mb-4 border border-blue-100">
            {t.hero.tagline}
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 uppercase">
            {t.hero.title}
          </h1>
          <p className="text-xl font-bold text-blue-600 mb-6">{t.hero.subtitle}</p>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t.hero.description}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 flex items-center gap-2">
              {t.hero.cta} <ArrowRightIcon className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
            <button className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition">
              {t.hero.demo}
            </button>
          </div>
        </div>
      </section>

      {/* KPI Section */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-8 rounded-2xl border border-slate-100">
          {t.kpis.map((kpi, i) => (
            <div key={i} className="text-center p-4">
              <div className="text-3xl font-black text-blue-600 mb-1">{kpi.value}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Section */}
      <section className="py-20 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">{language === 'en' ? 'Core Systems' : 'الأنظمة الأساسية'}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {t.features.map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="mb-6 p-3 bg-blue-600 w-fit rounded-xl text-white">
                  {i === 0 && <CubeIcon className="w-6 h-6" />}
                  {i === 1 && <CalendarIcon className="w-6 h-6" />}
                  {i === 2 && <ChartBarIcon className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <ul className="space-y-3">
                  {feature.items.map((item, j) => (
                    <li key={j} className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sector Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">{language === 'en' ? 'Who is it for?' : 'من يستفيد؟'}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {t.sectors.map((s, i) => (
            <div key={i} className="p-6 border border-slate-100 rounded-xl text-center font-bold text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition cursor-default">
              {s}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <p className="text-2xl font-bold mb-6 italic leading-relaxed">"{t.testimonial.quote}"</p>
          <p className="font-black text-blue-200">— {t.testimonial.author}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 text-center">
        <p className="text-slate-500 text-sm font-bold">© 2026 WESALTECH. All rights reserved.</p>
      </footer>
    </div>
  );
}