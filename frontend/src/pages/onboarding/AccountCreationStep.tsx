import React, { useState } from 'react';
import { useTranslation } from '@/lib/translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';

interface AccountCreationStepProps {
  onNext: (data: any) => void;
  onBack?: () => void;
}

export const AccountCreationStep: React.FC<AccountCreationStepProps> = ({ onNext }) => {
  const { isRTL } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const passwordRequirements = [
    { 
      id: 'length', 
      text: isRTL ? 'على الأقل 8 أحرف' : 'At least 8 characters',
      met: formData.password.length >= 8 
    },
    { 
      id: 'uppercase', 
      text: isRTL ? 'حرف كبير واحد' : 'One uppercase letter',
      met: /[A-Z]/.test(formData.password) 
    },
    { 
      id: 'lowercase', 
      text: isRTL ? 'حرف صغير واحد' : 'One lowercase letter',
      met: /[a-z]/.test(formData.password) 
    },
    { 
      id: 'number', 
      text: isRTL ? 'رقم واحد' : 'One number',
      met: /\d/.test(formData.password) 
    },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = isRTL ? 'الاسم مطلوب' : 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = isRTL ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = isRTL ? 'البريد الإلكتروني غير صحيح' : 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = isRTL ? 'كلمة المرور مطلوبة' : 'Password is required';
    } else if (!passwordRequirements.every(req => req.met)) {
      newErrors.password = isRTL ? 'كلمة المرور لا تلبي المتطلبات' : 'Password does not meet requirements';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Since the user account already exists and business info is saved,
      // we just need to mark onboarding as complete
      onNext(formData);
    } catch (error) {
      console.error('Account creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {isRTL ? 'إنشاء حسابك' : 'Create your account'}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {isRTL 
            ? 'ابدأ رحلتك مع WesalTech اليوم'
            : 'Start your journey with WesalTech today'
          }
        </p>
      </div>

      {/* Google Sign Up */}
      <div className="space-y-4">
        <GoogleSignInButton 
          variant="register"
          onError={(error) => setErrors({ general: error })}
        />
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-slate-800 px-4 text-gray-500 dark:text-gray-400">
              {isRTL ? 'أو' : 'or'}
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {isRTL ? 'الاسم الكامل' : 'Full Name'}
          </Label>
          <div className="relative">
            <UserIcon className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`h-12 ${isRTL ? 'pr-10 text-right' : 'pl-10'} border-2 focus:border-blue-500 transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
            />
          </div>
          {errors.name && <p className="text-sm text-red-500 font-medium">{errors.name}</p>}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
          </Label>
          <div className="relative">
            <EnvelopeIcon className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`h-12 ${isRTL ? 'pr-10 text-right' : 'pl-10'} border-2 focus:border-blue-500 transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'}
            />
          </div>
          {errors.email && <p className="text-sm text-red-500 font-medium">{errors.email}</p>}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {isRTL ? 'كلمة المرور' : 'Password'}
          </Label>
          <div className="relative">
            <LockClosedIcon className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`h-12 ${isRTL ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10'} border-2 focus:border-blue-500 transition-colors ${
                errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={isRTL ? 'أدخل كلمة مرور قوية' : 'Enter a strong password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Password Requirements */}
          {formData.password && (
            <div className="mt-3 space-y-2">
              {passwordRequirements.map((req) => (
                <div key={req.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                  {req.met ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={`text-sm ${req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {req.text}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {errors.password && <p className="text-sm text-red-500 font-medium">{errors.password}</p>}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
          </Label>
          <div className="relative">
            <LockClosedIcon className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`h-12 ${isRTL ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10'} border-2 focus:border-blue-500 transition-colors ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={isRTL ? 'أعد إدخال كلمة المرور' : 'Re-enter your password'}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}
            >
              {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-sm text-red-500 font-medium">{errors.confirmPassword}</p>}
        </div>

        {/* Terms */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isRTL ? 'بإنشاء حساب، أنت توافق على' : 'By creating an account, you agree to our'}{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              {isRTL ? 'شروط الخدمة' : 'Terms of Service'}
            </a>{' '}
            {isRTL ? 'و' : 'and'}{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </a>
          </p>
        </div>

        {errors.general && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>{isRTL ? 'جاري الإنشاء...' : 'Creating Account...'}</span>
            </div>
          ) : (
            <span>{isRTL ? 'إنشاء الحساب' : 'Create Account'}</span>
          )}
        </Button>
      </form>

      {/* Login Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            {isRTL ? 'تسجيل الدخول' : 'Sign in'}
          </a>
        </p>
      </div>
    </div>
  );
};