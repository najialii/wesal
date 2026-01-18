import React, { useState } from 'react';
import { useTranslation } from '@/lib/translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface ContactInfoStepProps {
  initialData?: {
    phone?: string;
    email?: string;
    address?: string;
    tax_number?: string;
    cr_number?: string;
  };
  onComplete: (data: any) => Promise<void>;
}

export const ContactInfoStep: React.FC<ContactInfoStepProps> = ({
  initialData,
  onComplete,
}) => {
  const { t, isRTL } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formValues, setFormValues] = useState({
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    tax_number: initialData?.tax_number || '',
    cr_number: initialData?.cr_number || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const newErrors: Record<string, string> = {};
    
    if (!formValues.phone.trim()) {
      newErrors.phone = t('onboarding.step1.validation.phoneRequired');
    }
    if (!formValues.email.trim()) {
      newErrors.email = t('onboarding.step1.validation.emailRequired');
    }
    if (!formValues.address.trim()) {
      newErrors.address = t('onboarding.step1.validation.addressRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      await onComplete(formValues);
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group">
          <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
            {t('onboarding.step1.form.phone')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formValues.phone}
            onChange={handleInputChange}
            placeholder={t('onboarding.step1.form.phonePlaceholder')}
            className={`h-12 text-base border-2 transition-all ${
              errors.phone 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400'
            }`}
          />
          {errors.phone && <p className="text-sm text-red-500 mt-1.5 font-medium">{errors.phone}</p>}
        </div>

        <div className="group">
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
            {t('onboarding.step1.form.email')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formValues.email}
            onChange={handleInputChange}
            placeholder={t('onboarding.step1.form.emailPlaceholder')}
            className={`h-12 text-base border-2 transition-all ${
              errors.email 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400'
            }`}
          />
          {errors.email && <p className="text-sm text-red-500 mt-1.5 font-medium">{errors.email}</p>}
        </div>
      </div>

      {/* Address - Full Width */}
      <div className="group">
        <Label htmlFor="address" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
          {t('onboarding.step1.form.address')} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="address"
          name="address"
          type="text"
          value={formValues.address}
          onChange={handleInputChange}
          placeholder={t('onboarding.step1.form.addressPlaceholder')}
          className={`h-12 text-base border-2 transition-all ${
            errors.address 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400'
          }`}
        />
        {errors.address && <p className="text-sm text-red-500 mt-1.5 font-medium">{errors.address}</p>}
      </div>

      {/* Optional Fields */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
          {t('onboarding.step1.form.optional') || 'Optional Information'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group">
            <Label htmlFor="tax_number" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              {t('onboarding.step1.form.taxNumber')}
            </Label>
            <Input
              id="tax_number"
              name="tax_number"
              type="text"
              value={formValues.tax_number}
              onChange={handleInputChange}
              placeholder={t('onboarding.step1.form.taxNumberPlaceholder')}
              className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400 transition-all"
            />
          </div>

          <div className="group">
            <Label htmlFor="cr_number" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              {t('onboarding.step1.form.crNumber')}
            </Label>
            <Input
              id="cr_number"
              name="cr_number"
              type="text"
              value={formValues.cr_number}
              onChange={handleInputChange}
              placeholder={t('onboarding.step1.form.crNumberPlaceholder')}
              className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400 transition-all"
            />
          </div>
        </div>
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
            <span>{t('onboarding.buttons.finish')}</span>
            <ArrowRightIcon className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </div>
        )}
      </Button>
    </form>
  );
};
