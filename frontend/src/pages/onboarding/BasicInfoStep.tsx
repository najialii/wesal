import React, { useState } from 'react';
import { useTranslation } from '@/lib/translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoIcon, XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { BuildingOfficeIcon } from '@heroicons/react/24/solid';

interface BasicInfoStepProps {
  initialData?: {
    name: string;
    logo?: string;
  };
  onComplete: (data: { name: string; logo?: File }) => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  initialData,
  onComplete,
}) => {
  const { t, isRTL } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const [formValues, setFormValues] = useState({
    name: initialData?.name || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setLogoFile(file);
    }
  };

  const clearLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    const fileInput = document.getElementById('logo') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const newErrors: Record<string, string> = {};
    
    if (!formValues.name.trim()) {
      newErrors.name = t('onboarding.step1.validation.nameRequired');
    }

    if (logoFile) {
      if (logoFile.size > 5 * 1024 * 1024) {
        newErrors.logo = t('onboarding.step1.validation.logoSize');
      }
      if (!logoFile.type.startsWith('image/')) {
        newErrors.logo = t('onboarding.step1.validation.logoType');
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      onComplete({
        name: formValues.name,
        logo: logoFile || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Logo Upload Section */}
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-primary-100 dark:border-primary-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            {logoPreview ? (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-blue-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="relative h-40 w-40 object-cover rounded-3xl border-4 border-white dark:border-gray-800 shadow-2xl"
                />
                <button
                  type="button"
                  onClick={clearLogo}
                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 hover:scale-110 transition-all"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <label 
                htmlFor="logo" 
                className="group relative flex flex-col items-center justify-center h-40 w-40 border-3 border-dashed border-primary-300 dark:border-primary-700 rounded-3xl cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-all bg-white dark:bg-gray-800 hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-blue-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <PhotoIcon className="relative h-16 w-16 text-primary-400 group-hover:text-primary-600 transition-colors" />
                <span className="relative mt-3 text-sm font-medium text-primary-600 dark:text-primary-400">
                  {t('onboarding.step1.form.logo')}
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
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('onboarding.step1.form.logoHint')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{t('onboarding.step1.form.optional')}</p>
            {errors.logo && <p className="text-sm text-red-500 mt-1 font-medium">{errors.logo}</p>}
          </div>
        </div>
      </div>

      {/* Business Name */}
      <div className="group">
        <Label htmlFor="name" className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <BuildingOfficeIcon className="h-4 w-4 mr-2 text-primary-500" />
          {t('onboarding.step1.form.name')} <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          value={formValues.name}
          onChange={handleInputChange}
          placeholder={t('onboarding.step1.form.namePlaceholder')}
          className={`h-12 text-base border-2 transition-all ${
            errors.name 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400'
          }`}
        />
        {errors.name && <p className="text-sm text-red-500 mt-1.5 font-medium">{errors.name}</p>}
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className={`w-full h-14 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] ${
          isRTL ? 'flex-row-reverse' : ''
        }`}
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
            {t('loading')}
          </div>
        ) : (
          <div className={`flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>{t('onboarding.buttons.continue')}</span>
            <ArrowRightIcon className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </div>
        )}
      </Button>
    </form>
  );
};
