import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { GoogleSignInButton } from '../components/ui/GoogleSignInButton';
import { SimpleLanguageToggle } from '../components/SimpleLanguageToggle';
import { useTranslation } from '../lib/translation';
import { 
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    company_name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t, isRTL, currentLanguage } = useTranslation('auth');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
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
      
      // Redirect to onboarding for new users
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

      {/* Centered Registration Form */}
      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <img src="/1.svg" alt="WesalTech" className="w-32 h-28" />
            </div>
          </div>

          {/* Registration Card */}
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {isRTL ? 'إنشاء حساب جديد' : 'Create Account'}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {isRTL ? 'ابدأ رحلتك في إدارة الأعمال' : 'Start your business management journey'}
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
                  <Label htmlFor="name" className={`text-gray-700 dark:text-gray-300 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('full_name') || 'Full Name'}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder={t('full_name_placeholder') || 'Enter your full name'}
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`h-11 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className={`text-gray-700 dark:text-gray-300 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('email_label') || 'Email'}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder={t('email_placeholder') || 'Enter your email'}
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`h-11 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name" className={`text-gray-700 dark:text-gray-300 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('company_name') || 'Company Name'} <span className="text-gray-400">({t('optional') || 'Optional'})</span>
                  </Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    type="text"
                    placeholder={t('company_name_placeholder') || 'Enter your company name'}
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className={`h-11 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className={`text-gray-700 dark:text-gray-300 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('password_label') || 'Password'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder={t('password_placeholder') || 'Enter your password'}
                      value={formData.password}
                      onChange={handleInputChange}
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

                <div className="space-y-2">
                  <Label htmlFor="password_confirmation" className={`text-gray-700 dark:text-gray-300 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('confirm_password') || 'Confirm Password'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password_confirmation"
                      name="password_confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder={t('confirm_password_placeholder') || 'Confirm your password'}
                      value={formData.password_confirmation}
                      onChange={handleInputChange}
                      className={`h-11 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 ${isRTL ? 'text-right pr-10' : 'text-left pr-10'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute inset-y-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ${isRTL ? 'left-0' : 'right-0'}`}
                    >
                      {showConfirmPassword ? (
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
                      <span>{t('creating_account') || 'Creating Account...'}</span>
                    </div>
                  ) : (
                    t('create_account') || 'Create Account'
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
                variant="register"
                onError={(error) => setError(error)}
              />

              {/* Login Link */}
              <div className="pt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('already_have_account') || 'Already have an account?'}{' '}
                  <Link 
                    to="/login" 
                    className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    {t('sign_in') || 'Sign in'}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('copyright') || '© 2024 WesalTech. All rights reserved.'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t('powered_by') || 'Powered by AI'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}