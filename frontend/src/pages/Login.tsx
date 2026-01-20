import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { SimpleLanguageToggle } from '../components/SimpleLanguageToggle';
import { GoogleSignInButton } from '../components/ui/GoogleSignInButton';
import { useTranslation, useDirectionClasses } from '../lib/translation';
import { 
  ExclamationTriangleIcon, 
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

export default function Login() {
  const [email, setEmail] = useState('admin@wesaltech.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation('auth');
  const { isRTL } = useDirectionClasses();

  // Rotating messages array
  const messages = [
    {
      ar: 'إدارة أذكى.. لنتائج أفضل',
      en: 'Smarter management.. for better results'
    },
    {
      ar: 'لا حدود لإنجازك',
      en: 'No limits to what you can achieve'
    },
    {
      ar: 'دقة في الإدارة، سرعة في الإنجاز',
      en: 'Precision in management, speed in execution'
    }
  ];

  // Select a random message on component mount
  useState(() => {
    return messages[Math.floor(Math.random() * messages.length)];
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login({ email, password });
      
      // Check if user is a technician
      let isTechnician = false;
      if (response.user.roles && Array.isArray(response.user.roles)) {
        isTechnician = response.user.roles.some((r: any) => r.name === 'technician');
      } else if (response.user.role) {
        isTechnician = response.user.role === 'technician';
      }
      
      // Check if user is business owner
      let isBusinessOwner = false;
      if (response.user.roles && Array.isArray(response.user.roles)) {
        isBusinessOwner = response.user.roles.some((r: any) => r.name === 'business_owner');
      } else if (response.user.role) {
        isBusinessOwner = response.user.role === 'business_owner';
      }
      
      // Redirect based on user type and onboarding status
      if (response.user.is_super_admin) {
        navigate('/admin');
      } else if (isTechnician) {
        navigate('/technician');
      } else if (isBusinessOwner && response.user.onboarding_completed === false) {
        // Only business owners need to complete onboarding
        navigate('/onboarding');
      } else {
        navigate('/business');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      key={currentLanguage}
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ${isRTL ? 'font-tajawal' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      
      {/* Language Toggle */}
      <div className={`absolute top-6 z-10 ${isRTL ? 'left-6' : 'right-6'}`}>
        <SimpleLanguageToggle variant="button" size="sm" />
      </div>

      {/* Centered Login Form */}
      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center  transform hover:scale-105 transition-transform duration-300">
              <img src="/1.svg" alt="WesalTech" className="w-32 h-28" />
            </div>
            {/* <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WesalTech</h1> */}
            {/* <p className="text-gray-600 dark:text-gray-400 text-sm">{t('platform_subtitle')}</p> */}
          </div>

          {/* Login Card */}
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('sign_in_title')}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {t('sign_in_subtitle')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className={`text-gray-700 dark:text-gray-300 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('email_label')}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder={t('email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`h-11 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className={`text-gray-700 dark:text-gray-300 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('password_label')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder={t('password_placeholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`h-11 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 ${isRTL ? 'text-right pr-10' : 'text-left pr-10'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ${isRTL ? 'left-0' : 'right-0'}`}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t('signing_in')}</span>
                    </div>
                  ) : (
                    t('sign_in')
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-800 px-2 text-gray-500 dark:text-gray-400">
                    {t('or') || 'Or'}
                  </span>
                </div>
              </div>

              {/* Google Sign-In */}
              <GoogleSignInButton 
                variant="login"
                onError={(error) => setError(error)}
              />

              {/* Register Link */}
              <div className="pt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('no_account') || "Don't have an account?"}{' '}
                  <Link 
                    to="/register" 
                    className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    {t('create_account') || 'Create one'}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('copyright')}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t('powered_by')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}