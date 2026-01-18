import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { GoogleSignInButton } from '../../components/ui/GoogleSignInButton';
import { useTranslation } from '../../lib/translation';
import { 
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

interface RegisterStepProps {
  onComplete: () => void;
}

export default function RegisterStep({ onComplete }: RegisterStepProps) {
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
  const { t, isRTL } = useTranslation('auth');

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
      // Move to next onboarding step
      onComplete();
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
    <div className="space-y-6">
      {/* Google Sign-In */}
      <GoogleSignInButton 
        variant="register"
        onError={(error) => setError(error)}
      />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-800 px-2 text-gray-500 dark:text-gray-400">
            {t('or_create_with_email') || 'Or create with email'}
          </span>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <UserPlusIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">
                {t('registering_as_owner') || 'You are registering as a Business Owner'}
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                {t('owner_description') || 'As the owner, you will have full access to manage your business, add staff members, and configure all settings.'}
              </p>
            </div>
          </div>
        </div>
        
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
            className={`h-11 ${isRTL ? 'text-right' : 'text-left'}`}
          />
        </div>

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
            value={formData.email}
            onChange={handleInputChange}
            className={`h-11 ${isRTL ? 'text-right' : 'text-left'}`}
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
            className={`h-11 ${isRTL ? 'text-right' : 'text-left'}`}
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
              value={formData.password}
              onChange={handleInputChange}
              className={`h-11 ${isRTL ? 'text-right pr-10' : 'text-left pr-10'}`}
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
              className={`h-11 ${isRTL ? 'text-right pr-10' : 'text-left pr-10'}`}
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
          className="w-full h-11 bg-primary-600 hover:bg-primary-700 text-white font-medium"
        >
          {loading ? (
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('creating_account') || 'Creating Account...'}</span>
            </div>
          ) : (
            t('create_account_continue') || 'Create Account & Continue'
          )}
        </Button>
      </form>
    </div>
  );
}
