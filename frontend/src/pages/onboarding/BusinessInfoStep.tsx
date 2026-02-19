import React, { useState } from 'react';
import { useTranslation } from '@/lib/translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  PhotoIcon, 
  XMarkIcon, 
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface BusinessInfoStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
} 

export const BusinessInfoStep: React.FC<BusinessInfoStepProps> = ({ onNext, onBack, initialData }) => {
  const { isRTL } = useTranslation();
  const [formData, setFormData] = useState({
    businessName: initialData?.businessName || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    phone: initialData?.phone || '',
    logo: initialData?.logo || null,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logoPreview || null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Check authentication on component mount
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setErrors({ submit: isRTL ? 'يجب تسجيل الدخول أولاً' : 'Please log in first' });
      return;
    }

    // Test authentication by checking onboarding status
    const testAuth = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${API_URL}/onboarding/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) {
          setErrors({ submit: isRTL ? 'انتهت صلاحية جلسة المستخدم' : 'User session expired' });
        } else {
          // const result = await response.json();
          // console.log('Auth test successful:', result);
        }
      } catch (error) {
        console.error('Auth test failed:', error);
        setErrors({ submit: isRTL ? 'فشل في التحقق من المصادقة' : 'Authentication verification failed' });
      }
    };

    testAuth();
  }, [isRTL]);



  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ logo: isRTL ? 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' : 'Image size must be less than 5MB' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrors({ logo: isRTL ? 'يجب أن يكون الملف صورة' : 'File must be an image' });
        return;
      }
      
      setFormData(prev => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, logo: '' }));
    }
  };

  const clearLogo = () => {
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo: null }));
    const fileInput = document.getElementById('logo') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = isRTL ? 'اسم العمل مطلوب' : 'Business name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = isRTL ? 'رقم الهاتف مطلوب' : 'Phone number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = isRTL ? 'العنوان مطلوب' : 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Prepare form data for API
      const apiFormData = new FormData();
      apiFormData.append('name', formData.businessName);
      apiFormData.append('phone', formData.phone);
      apiFormData.append('address', `${formData.address}${formData.city ? ', ' + formData.city : ''}`);
      apiFormData.append('_method', 'PUT'); // Laravel method override
      
      if (formData.logo) {
        apiFormData.append('logo', formData.logo);
      }

      // Debug: Log what we're sending (commented out for production)
      // console.log('Sending data:', {
      //   name: formData.businessName,
      //   phone: formData.phone,
      //   email: formData.email,
      //   address: `${formData.address}${formData.city ? ', ' + formData.city : ''}`,
      //   hasLogo: !!formData.logo,
      //   method: 'POST with _method=PUT'
      // });

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_URL}/onboarding/business-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: apiFormData,
      });

      const result = await response.json();
      
      // Debug: Log the full response (commented out for production)
      // console.log('API Response:', {
      //   status: response.status,
      //   ok: response.ok,
      //   result: result
      // });

      if (!response.ok) {
        if (result.errors) {
          console.log('Validation errors:', result.errors);
          // Handle validation errors
          const validationErrors: Record<string, string> = {};
          Object.keys(result.errors).forEach(key => {
            validationErrors[key] = Array.isArray(result.errors[key]) 
              ? result.errors[key][0] 
              : result.errors[key];
          });
          setErrors(validationErrors);
          return;
        }
        throw new Error(result.message || 'Failed to save business information');
      }

      if (result.success) {
        onNext({ ...formData, logoPreview });
      } else {
        throw new Error(result.message || 'Failed to save business information');
      }
    } catch (error: any) {
      console.error('Business info error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      if (error.message.includes('No authentication token')) {
        setErrors({ submit: isRTL ? 'لم يتم العثور على رمز المصادقة' : 'Authentication token not found' });
      } else {
        setErrors({ submit: error.message || (isRTL ? 'حدث خطأ أثناء الحفظ' : 'An error occurred while saving') });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      {/* <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {isRTL ? 'معلومات عملك' : 'Tell us about your business'}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {isRTL 
            ? 'ساعدنا في تخصيص التجربة لعملك'
            : 'Help us customize the experience for your business'
          }
        </p>
      </div> */}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Logo Upload */}
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isRTL ? 'شعار العمل' : 'Business Logo'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isRTL ? 'اختياري - يمكنك إضافته لاحقاً' : 'Optional - you can add this later'}
            </p>
            
            <div className="flex justify-center">
              {logoPreview ? (
                <div className="relative group">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="h-24 w-24 object-cover rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label 
                  htmlFor="logo" 
                  className="flex flex-col items-center justify-center h-24 w-24 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl cursor-pointer hover:border-blue-500 transition-colors bg-white dark:bg-gray-800"
                >
                  <PhotoIcon className="h-8 w-8 text-blue-400" />
                  <span className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                    {isRTL ? 'اختر' : 'Choose'}
                  </span>
                </label>
              )}
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>
            
            {errors.logo && <p className="text-sm text-red-500 mt-2">{errors.logo}</p>}
          </div>
        </div>

        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="businessName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {isRTL ? 'اسم العمل' : 'Business Name'} *
          </Label>
          <Input
            id="businessName"
            type="text"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            className={`h-12 border-2 focus:border-blue-500 transition-colors ${
              errors.businessName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder={isRTL ? 'أدخل اسم عملك' : 'Enter your business name'}
          />
          {errors.businessName && <p className="text-sm text-red-500">{errors.businessName}</p>}
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {isRTL ? 'العنوان' : 'Address'} *
            </Label>
            <div className="relative">
              <MapPinIcon className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={`h-12 ${isRTL ? 'pr-10' : 'pl-10'} border-2 focus:border-blue-500 transition-colors ${
                  errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={isRTL ? 'عنوان العمل' : 'Business address'}
              />
            </div>
            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {isRTL ? 'المدينة' : 'City'}
            </Label>
            <Input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="h-12 border-2 focus:border-blue-500 transition-colors"
              placeholder={isRTL ? 'المدينة' : 'City'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {isRTL ? 'رقم الهاتف' : 'Phone Number'} *
            </Label>
            <div className="relative">
              <PhoneIcon className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`h-12 ${isRTL ? 'pr-10' : 'pl-10'} border-2 focus:border-blue-500 transition-colors ${
                  errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={isRTL ? 'رقم الهاتف' : 'Phone number'}
              />
            </div>
            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 h-12 text-base border-2"
            disabled={loading}
          >
            {isRTL ? 'السابق' : 'Back'}
          </Button>
          <Button 
            type="submit" 
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{isRTL ? 'جاري الحفظ...' : 'Saving...'}</span>
              </div>
            ) : (
              <span>{isRTL ? 'التالي' : 'Continue'}</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};


