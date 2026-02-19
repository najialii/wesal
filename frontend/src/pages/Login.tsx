import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { SimpleLanguageToggle } from '../components/SimpleLanguageToggle';
import { GoogleSignInButton } from '../components/ui/GoogleSignInButton';
import { GoogleAuthDebug } from '../components/ui/GoogleAuthDebug';
import { useTranslation, useDirectionClasses } from '../lib/translation';
import { 
  ExclamationTriangleIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  CommandLineIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const { isRTL } = useDirectionClasses();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login({ email, password });
      
      const roles = Array.isArray(response.user.roles) 
        ? response.user.roles.map((r: any) => r.name) 
        : [response.user.role];

      const isTechnician = roles.includes('technician');
      const isBusinessOwner = roles.includes('business_owner');
      
      if (response.user.is_super_admin) {
        navigate('/admin');
      } else if (isTechnician) {
        navigate('/technician');
      } else if (isBusinessOwner && response.user.onboarding_completed === false) {
        navigate('/onboarding');
      } else {
        navigate('/business');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '';
      if (errorMessage.includes('credentials are incorrect') || errorMessage.includes('Invalid credentials')) {
        setError(t('invalid_credentials'));
      } else if (errorMessage) {
        setError(errorMessage);
      } else {
        setError(t('login_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white ${isRTL ? 'font-tajawal' : 'font-sans'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {showDebug ? (
        <div className="col-span-2 bg-slate-950 animate-in fade-in duration-500 overflow-auto">
          <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center sticky top-0 z-50">
            <h2 className="font-mono text-xs font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-2">
              <CommandLineIcon className="w-4 h-4" />
              Terminal_Debugger.v4
            </h2>
            <Button onClick={() => setShowDebug(false)} variant="outline" size="sm" className="rounded-full border-slate-700 text-slate-300 hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest">
              Exit_Console
            </Button>
          </div>
          <div className="p-8">
            <GoogleAuthDebug />
          </div>
        </div>
      ) : (
        <>
          {/* Visual Sidebar - Dark Industrial Style */}
          <div className="hidden lg:flex bg-slate-900 flex-col justify-between p-16 relative overflow-hidden border-r-4 border-blue-600/10">
            {/* Blueprint Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-20 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-20">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-white uppercase italic">
                  WESAL<span className="text-blue-500">TECH</span>
                </span>
              </div>

              <div className="space-y-8 max-w-sm">
                <h1 className="text-6xl font-black tracking-tighter text-white leading-[1] uppercase italic">
                  {isRTL ? 'تحكم بذكاء، نمُّ بذكاء.' : 'Manage Smarter. Scale Faster.'}
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">
                  {isRTL 
                    ? 'المنصة المتكاملة لإدارة الأصول والمخزون وعمليات الصيانة في مكان واحد.'
                    : 'The unified architectural workspace for asset management and field operations.'}
                </p>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-12 border-t-2 border-slate-800 pt-12">
              <div>
                <p className="text-white font-black text-3xl tracking-tighter italic">99.9%</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Uptime SLA</p>
              </div>
              <div>
                <p className="text-white font-black text-3xl tracking-tighter italic">256-BIT</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Encrypted</p>
              </div>
            </div>
          </div>

          {/* Login Section */}
          <div className="flex flex-col justify-center px-8 py-12 lg:px-24 bg-white relative">
            <div className={`absolute top-8 ${isRTL ? 'left-8' : 'right-8'} z-20`}>
              <SimpleLanguageToggle variant="button" size="sm" />
            </div>

            <div className="w-full max-w-md mx-auto">
              <div className="mb-12">
                <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 uppercase italic">
                  {t('sign_in_title') || 'INITIALIZE'}
                </h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">
                  {t('sign_in_subtitle') || 'Enter authorized credentials'}
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
                  <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {t('email_label') || 'Identification'}
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    placeholder="name@enterprise.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-14 border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:border-blue-600 outline-none px-5 font-bold transition-all" 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <Label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {t('password_label') || 'Security Key'}
                    </Label>
                    <Link to="/forgot-password" size="sm" className="text-[10px] font-black text-blue-600 hover:text-slate-900 uppercase tracking-widest transition-colors">
                      {isRTL ? 'نسيت كلمة المرور؟' : 'Recover Key?'}
                    </Link>
                  </div>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      required 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="h-14 border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:border-blue-600 outline-none px-5 font-bold pr-12 transition-all" 
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

                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-14 bg-blue-600 hover:bg-slate-900 text-white font-black rounded-2xl shadow-xl transition-all duration-300 uppercase tracking-tighter flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {t('sign_in')}
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
                  <span className="bg-white px-6 text-slate-400">{t('or') || 'Third Party Identity'}</span>
                </div>
              </div>

              <GoogleSignInButton variant="login" onError={(error) => setError(error)} />

              <div className="mt-12 text-center">
                <p className="text-sm text-slate-500 font-bold">
                  {t('no_account')}{' '}
                  <Link to="/register" className="text-blue-600 font-black hover:text-slate-900 underline underline-offset-4 decoration-2 transition-all">
                    {t('create_account') || 'Join WesalTech'}
                  </Link>
                </p>
              </div>

              {/* Developer Access */}
              <div className="mt-16 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowDebug(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-[10px] font-black text-slate-400 hover:bg-slate-100 hover:text-blue-600 hover:border-blue-100 transition-all uppercase tracking-[0.2em]"
                >
                  <CommandLineIcon className="w-4 h-4" />
                  DEBUG_MODE
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}