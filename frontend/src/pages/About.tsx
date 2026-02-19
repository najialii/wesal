import { Link } from 'react-router-dom';
import { useState } from 'react';
import { 
  SparklesIcon, 
  GlobeAltIcon, 
  UserGroupIcon, 
  LightBulbIcon, 
  ShieldCheckIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';

export default function About() {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const isRTL = language === 'ar';

  const content = {
    en: {
      title: 'WESALTECH',
      subtitle: 'The Infrastructure of Technical Growth',
      mission: {
        title: 'Our Mission',
        description: 'To provide technical businesses with the tools they need to operate efficiently, serve customers better, and grow sustainably. We believe that every technical service provider deserves access to world-class management software.'
      },
      story: {
        title: 'Our Story',
        description: 'Founded in 2024, WesalTech was born from firsthand experience in the technical services industry. We saw businesses struggling with outdated systems and manual processes. We built Wesal to solve these problems with a unified platform designed for technical operations.'
      },
      values: [
        {
          icon: UserGroupIcon,
          title: 'Customer First',
          description: 'Every feature we build starts with understanding our customers\' needs.'
        },
        {
          icon: LightBulbIcon,
          title: 'Innovation',
          description: 'We continuously adapt to the changing needs of technical businesses.'
        },
        {
          icon: ShieldCheckIcon,
          title: 'Trust & Security',
          description: 'Your data security and privacy are our top priorities.'
        }
      ],
      stats: [
        { value: '500+', label: 'Active Businesses' },
        { value: '50k+', label: 'Daily Transactions' },
        { value: '99.9%', label: 'Uptime' },
        { value: '24/7', label: 'Support' }
      ],
      team: {
        title: 'Built by Experts',
        description: 'Our team combines deep technical expertise with years of experience in the service industry. We understand your challenges because we\'ve faced them ourselves.'
      },
      cta: {
        title: 'Ready to join the transformation?',
        description: 'Be part of the digital evolution in technical services.',
        button: 'Get Started Today'
      }
    },
    ar: {
      title: 'وصالتك',
      subtitle: 'البنية التحتية للنمو التقني',
      mission: {
        title: 'مهمتنا',
        description: 'تزويد الشركات التقنية بالأدوات التي تحتاجها للعمل بكفاءة وخدمة العملاء بشكل أفضل والنمو المستدام. نؤمن بأن كل مزود خدمة تقنية يستحق الوصول إلى برامج إدارة عالمية المستوى.'
      },
      story: {
        title: 'قصتنا',
        description: 'تأسست وصالتك في عام 2024، ولدت من تجربة مباشرة في صناعة الخدمات التقنية. رأينا الشركات تكافح مع الأنظمة القديمة والعمليات اليدوية. قمنا ببناء وصال لحل هذه المشاكل بمنصة موحدة مصممة للعمليات التقنية.'
      },
      values: [
        {
          icon: UserGroupIcon,
          title: 'العميل أولاً',
          description: 'كل ميزة نبنيها تبدأ بفهم احتياجات عملائنا.'
        },
        {
          icon: LightBulbIcon,
          title: 'الابتكار',
          description: 'نتكيف باستمرار مع الاحتياجات المتغيرة للشركات التقنية.'
        },
        {
          icon: ShieldCheckIcon,
          title: 'الثقة والأمان',
          description: 'أمان بياناتك وخصوصيتك هما أولويتنا القصوى.'
        }
      ],
      stats: [
        { value: '500+', label: 'شركة نشطة' },
        { value: '50k+', label: 'معاملة يومياً' },
        { value: '99.9%', label: 'وقت التشغيل' },
        { value: '24/7', label: 'الدعم' }
      ],
      team: {
        title: 'بناه الخبراء',
        description: 'يجمع فريقنا بين الخبرة التقنية العميقة وسنوات من الخبرة في صناعة الخدمات. نفهم تحدياتك لأننا واجهناها بأنفسنا.'
      },
      cta: {
        title: 'جاهز للانضمام إلى التحول؟',
        description: 'كن جزءاً من التطور الرقمي في الخدمات التقنية.',
        button: 'ابدأ اليوم'
      }
    }
  };

  const t = content[language];

  return (
    <div className={`min-h-screen bg-white text-slate-800 ${isRTL ? 'font-tajawal' : 'font-sans'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white border-b border-slate-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">{isRTL ? 'وصالتك' : 'WESALTECH'}</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">Home</Link>
            <Link to="/about" className="text-sm font-bold text-blue-600">About</Link>
            <Link to="/contact" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">Contact</Link>
          </div>
          <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="p-2 rounded-full hover:bg-slate-100 transition">
            <GlobeAltIcon className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 text-center bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 uppercase tracking-tight">{t.title}</h1>
          <p className="text-xl md:text-2xl font-bold text-blue-600">{t.subtitle}</p>
        </div>
      </section>

      {/* Mission & Story - Card Style */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-10 bg-white border-2 border-slate-100 rounded-3xl hover:border-blue-200 transition">
            <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase italic">{t.mission.title}</h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">{t.mission.description}</p>
          </div>
          <div className="p-10 bg-slate-900 text-white rounded-3xl shadow-xl">
            <h2 className="text-3xl font-black mb-6 uppercase italic text-blue-400">{t.story.title}</h2>
            <p className="text-lg text-slate-300 leading-relaxed">{t.story.description}</p>
          </div>
        </div>
      </section>

      {/* Stats - High Contrast */}
      <section className="py-16 px-6 bg-blue-600">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {t.stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</div>
              <div className="text-xs font-bold text-blue-100 uppercase tracking-[0.2em]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values - Modern Icon Grid */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-center text-slate-900 mb-16 uppercase">{isRTL ? 'قيمنا' : 'Our Values'}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {t.values.map((value, i) => (
              <div key={i} className="bg-white p-10 rounded-2xl border border-slate-200 text-center hover:shadow-xl transition-all group">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <value.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{value.title}</h3>
                <p className="text-slate-600 font-medium">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 mb-8 uppercase leading-tight">{t.team.title}</h2>
          <p className="text-xl text-slate-600 font-medium mb-12 leading-relaxed">{t.team.description}</p>
          <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-12">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">{t.cta.title}</h3>
            <p className="text-slate-600 mb-8 font-medium">{t.cta.description}</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-blue-600 text-white px-10 py-5 rounded-xl font-black text-xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition transform hover:-translate-y-1">
              {t.cta.button}
              <ArrowRightIcon className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">© 2026 WESALTECH. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}