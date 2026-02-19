import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { GoogleSignInButton } from '../components/ui/GoogleSignInButton';
import { SimpleLanguageToggle } from '../components/SimpleLanguageToggle';
import { useTranslation, useDirectionClasses } from '../lib/translation';
import { 
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  Square3Stack3DIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const { isRTL } = useDirectionClasses();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError(t('password_mismatch') || 'Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError(t('password_too_short') || 'Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      await authService.register(formData);
      navigate('/onboarding');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.email?.[0] ||
                          t('registration_failed') || 
                          'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white ${isRTL ? 'font-tajawal' : 'font-sans'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Visual Sidebar - Dark Industrial Style */}
      <div className="hidden lg:flex bg-slate-900 flex-col justify-between p-16 relative overflow-hidden">
        {/* Architectural Blueprint Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 pointer-events-none" />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Square3Stack3DIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white uppercase italic">
              WESAL<span className="text-blue-500">TECH</span>
            </span>
          </Link>

          <h1 className="text-5xl font-black tracking-tighter text-white mb-8 leading-[1.1] uppercase italic">
            {isRTL ? 'ابدأ رحلتك معنا' : 'Start your journey today.'}
          </h1>
          
          <div className="space-y-10 mt-16">
            {[
              { 
                icon: Square3Stack3DIcon, 
                title: isRTL ? 'إدارة شاملة' : 'COMPLETE MANAGEMENT', 
                desc: isRTL ? 'كل ما تحتاجه لإدارة عملك' : 'Everything you need to run your business.' 
              },
              { 
                icon: ShieldCheckIcon, 
                title: isRTL ? 'آمن ومحمي' : 'SECURE & PROTECTED', 
                desc: isRTL ? 'بياناتك في أمان تام' : 'Your data is safe with us.' 
              },
              { 
                icon: GlobeAltIcon, 
                title: isRTL ? 'دعم متعدد اللغات' : 'MULTI-LANGUAGE', 
                desc: isRTL ? 'عربي وإنجليزي' : 'Arabic & English support.' 
              }
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-5 group">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-blue-400 group-hover:text-white group-hover:border-blue-500 transition-all duration-300 shadow-md">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm tracking-widest uppercase mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-12 border-t-2 border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
            Wesal Systems &copy; 2026 • Riyadh Headquarters
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex flex-col justify-center px-8 py-12 lg:px-24 bg-white relative">
        <div className={`absolute top-8 ${isRTL ? 'left-8' : 'right-8'}`}>
          <SimpleLanguageToggle variant="button" size="sm" />
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="mb-12 text-center lg:text-start">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 uppercase italic">
              {t('create_account') || 'Create Account'}
            </h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">
              {t('register_subtitle') || 'Start your free trial today'}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="border-2 border-red-500 bg-red-50 text-red-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(239,68,68,1)]">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <AlertDescription className="font-bold">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {t('full_name') || 'Full Name'}
              </Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange}
                className="h-14 border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:border-blue-600 outline-none px-5 font-bold transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {t('email_label') || 'Email Address'}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleInputChange}
                className="h-14 border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:border-blue-600 outline-none px-5 font-bold transition-all shadow-sm"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {t('password_label') || 'Password'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="h-14 border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:border-blue-600 outline-none px-5 font-bold pr-12 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 flex items-center px-4 text-slate-400 hover:text-blue-600 ${isRTL ? 'left-0' : 'right-0'}`}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirmation" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {t('confirm_password') || 'Verify'}
                </Label>
                <div className="relative">
                  <Input
                    id="password_confirmation"
                    name="password_confirmation"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.password_confirmation}
                    onChange={handleInputChange}
                    className="h-14 border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:border-blue-600 outline-none px-5 font-bold pr-12 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute inset-y-0 flex items-center px-4 text-slate-400 hover:text-blue-600 ${isRTL ? 'left-0' : 'right-0'}`}
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-14 bg-blue-600 hover:bg-slate-900 text-white font-black rounded-2xl shadow-xl transition-all duration-300 uppercase tracking-tighter flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('create_account') || 'Create Account'}
                  <ArrowRightIcon className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2 border-slate-100" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-black">
              <span className="bg-white px-6 text-slate-400">{t('or') || 'Third Party SSO'}</span>
            </div>
          </div>

          <GoogleSignInButton variant="register" onError={(error) => setError(error)} />

          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500 font-bold">
              {t('already_have_account') || 'Already have an account?'}{' '}
              <Link to="/login" className="text-blue-600 hover:text-slate-900 underline underline-offset-4 decoration-2 transition-all">
                {t('sign_in') || 'Sign in'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}