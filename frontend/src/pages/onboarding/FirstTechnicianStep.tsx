import React, { useState } from 'react';
import { useTranslation } from '@/lib/translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FirstTechnicianStepProps {
  onComplete: (data: any) => Promise<void>;
}

export const FirstTechnicianStep: React.FC<FirstTechnicianStepProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
    };

    // Client-side validation
    const newErrors: Record<string, string> = {};
    
    if (!data.name) {
      newErrors.name = t('onboarding.step3.validation.nameRequired');
    }
    if (!data.email) {
      newErrors.email = t('onboarding.step3.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = t('onboarding.step3.validation.emailInvalid');
    }
    if (!data.phone) {
      newErrors.phone = t('onboarding.step3.validation.phoneRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      await onComplete(data);
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
      <div>
        <Label htmlFor="name">{t('onboarding.step3.form.name')}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder={t('onboarding.step3.form.namePlaceholder')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="email">{t('onboarding.step3.form.email')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t('onboarding.step3.form.emailPlaceholder')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="phone">{t('onboarding.step3.form.phone')}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder={t('onboarding.step3.form.phonePlaceholder')}
          className={errors.phone ? 'border-red-500' : ''}
        />
        {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t('loading') : t('onboarding.buttons.finish')}
      </Button>
    </form>
  );
};
