import { Link } from 'react-router-dom';
import { useState } from 'react';
import { 
  SparklesIcon, 
  GlobeAltIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function Contact() {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const isRTL = language === 'ar';

  const content = {
    en: {
      title: 'GET IN TOUCH',
      subtitle: 'Technical support and sales for the modern enterprise.',
      form: {
        name: 'Full Name',
        email: 'Email Address',
        phone: 'Phone Number',
        company: 'Company Name',
        message: 'Your Message',
        submit: 'Send Message',
        success: 'Transmission Received. We will contact you shortly.'
      },
      info: [
        { icon: EnvelopeIcon, title: 'Email', value: 'support@wesaltech.com', link: 'mailto:support@wesaltech.com' },
        { icon: PhoneIcon, title: 'Phone', value: '+966 50 123 4567', link: 'tel:+966501234567' },
        { icon: MapPinIcon, title: 'Headquarters', value: 'Riyadh, Saudi Arabia', link: null },
        { icon: ClockIcon, title: 'Operating Hours', value: 'Sun-Thu: 9AM - 6PM', link: null }
      ],
      sales: {
        title: 'Sales Inquiries',
        description: 'Interested in enterprise scaling? Our sales engineers are ready.',
        button: 'Schedule a Demo'
      },
      support: {
        title: 'Technical Support',
        description: 'Already part of the network? Access the 24/7 help center.',
        button: 'Open Ticket'
      }
    },
    ar: {
      title: 'تواصل معنا',
      subtitle: 'الدعم الفني والمبيعات للمؤسسات الحديثة.',
      form: {
        name: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',
        company: 'اسم الشركة',
        message: 'رسالتك',
        submit: 'إرسال الرسالة',
        success: 'تم استلام الرسالة. سنتواصل معك قريباً.'
      },
      info: [
        { icon: EnvelopeIcon, title: 'البريد الإلكتروني', value: 'support@wesaltech.com', link: 'mailto:support@wesaltech.com' },
        { icon: PhoneIcon, title: 'الهاتف', value: '+966 50 123 4567', link: 'tel:+966501234567' },
        { icon: MapPinIcon, title: 'المقر الرئيسي', value: 'الرياض، المملكة العربية السعودية', link: null },
        { icon: ClockIcon, title: 'ساعات العمل', value: 'الأحد-الخميس: 9 صباحاً - 6 مساءً', link: null }
      ],
      sales: {
        title: 'استفسارات المبيعات',
        description: 'مهتم بتوسيع نطاق أعمالك؟ مهندسو المبيعات لدينا جاهزون.',
        button: 'احجز عرضاً توضيحياً'
      },
      support: {
        title: 'الدعم الفني',
        description: 'جزء من الشبكة بالفعل؟ تفضل بزيارة مركز المساعدة.',
        button: 'فتح تذكرة'
      }
    }
  };

  const t = content[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className={`min-h-screen bg-white text-slate-800 ${isRTL ? 'font-tajawal' : 'font-sans'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white border-b-2 border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">{isRTL ? 'وصالتك' : 'WESALTECH'}</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/solutions" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">Solutions</Link>
            <Link to="/about" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">About</Link>
            <Link to="/contact" className="text-sm font-bold text-blue-600">Contact</Link>
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
          <p className="text-xl text-blue-400 font-bold tracking-wide">{t.subtitle}</p>
        </div>
      </section>

      {/* Main Contact Area */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
          
          {/* Form Card */}
          <div className="bg-white border-2 border-slate-900 rounded-[2rem] p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t.form.name}</label>
                  <input type="text" name="name" onChange={handleChange} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-blue-600 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t.form.email}</label>
                  <input type="email" name="email" onChange={handleChange} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-blue-600 outline-none transition" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t.form.phone}</label>
                  <input type="tel" name="phone" onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-blue-600 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t.form.company}</label>
                  <input type="text" name="company" onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-blue-600 outline-none transition" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t.form.message}</label>
                <textarea name="message" rows={4} onChange={handleChange} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-blue-600 outline-none transition" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl text-lg uppercase tracking-tighter hover:bg-blue-700 transition flex items-center justify-center gap-2">
                {t.form.submit}
                <ArrowRightIcon className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
              {submitted && (
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700 font-bold text-center animate-bounce">
                  {t.form.success}
                </div>
              )}
            </form>
          </div>

          {/* Contact Details & Links */}
          <div className="space-y-12">
            <div className="grid sm:grid-cols-2 gap-8">
              {t.info.map((item, i) => (
                <div key={i} className="group">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{item.title}</h4>
                  {item.link ? (
                    <a href={item.link} className="text-xl font-bold text-slate-900 hover:text-blue-600 transition">{item.value}</a>
                  ) : (
                    <p className="text-xl font-bold text-slate-900">{item.value}</p>
                  )}
                </div>
              ))}
            </div>

            <hr className="border-slate-100" />

            {/* Quick Link Cards */}
            <div className="grid gap-6">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-blue-600 transition cursor-pointer group">
                <div>
                  <h3 className="text-xl font-black uppercase italic text-slate-900">{t.sales.title}</h3>
                  <p className="text-slate-500 font-medium">{t.sales.description}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowRightIcon className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </div>
              </div>
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-blue-600 transition cursor-pointer group">
                <div>
                  <h3 className="text-xl font-black uppercase italic text-slate-900">{t.support.title}</h3>
                  <p className="text-slate-500 font-medium">{t.support.description}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowRightIcon className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t-2 border-slate-100 bg-white text-center">
        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">© 2026 WESALTECH • Riyadh Office</p>
      </footer>
    </div>
  );
}