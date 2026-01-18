import React, { useState } from 'react';
import { useTranslation } from '@/lib/translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FirstProductStepProps {
  onComplete: (data: any) => Promise<void>;
}

export const FirstProductStep: React.FC<FirstProductStepProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unit, setUnit] = useState('pieces');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      price: parseFloat(formData.get('price') as string),
      stock_quantity: parseInt(formData.get('stock_quantity') as string),
      unit: unit,
    };

    // Client-side validation
    const newErrors: Record<string, string> = {};
    
    if (!data.name) {
      newErrors.name = t('onboarding.step2.validation.nameRequired');
    }
    if (!data.sku) {
      newErrors.sku = t('onboarding.step2.validation.skuRequired');
    }
    if (!data.price || data.price <= 0) {
      newErrors.price = t('onboarding.step2.validation.priceMin');
    }
    if (data.stock_quantity === undefined || data.stock_quantity < 0) {
      newErrors.stock_quantity = t('onboarding.step2.validation.stockQuantityMin');
    }
    if (!data.unit) {
      newErrors.unit = t('onboarding.step2.validation.unitRequired');
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
        <Label htmlFor="name">{t('onboarding.step2.form.name')}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder={t('onboarding.step2.form.namePlaceholder')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="sku">{t('onboarding.step2.form.sku')}</Label>
        <Input
          id="sku"
          name="sku"
          type="text"
          placeholder={t('onboarding.step2.form.skuPlaceholder')}
          className={errors.sku ? 'border-red-500' : ''}
        />
        {errors.sku && <p className="text-sm text-red-500 mt-1">{errors.sku}</p>}
      </div>

      <div>
        <Label htmlFor="price">{t('onboarding.step2.form.price')}</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          placeholder={t('onboarding.step2.form.pricePlaceholder')}
          className={errors.price ? 'border-red-500' : ''}
        />
        {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
      </div>

      <div>
        <Label htmlFor="stock_quantity">{t('onboarding.step2.form.stockQuantity')}</Label>
        <Input
          id="stock_quantity"
          name="stock_quantity"
          type="number"
          min="0"
          placeholder={t('onboarding.step2.form.stockQuantityPlaceholder')}
          className={errors.stock_quantity ? 'border-red-500' : ''}
        />
        {errors.stock_quantity && <p className="text-sm text-red-500 mt-1">{errors.stock_quantity}</p>}
      </div>

      <div>
        <Label htmlFor="unit">{t('onboarding.step2.form.unit')}</Label>
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger className={errors.unit ? 'border-red-500' : ''}>
            <SelectValue placeholder={t('onboarding.step2.form.unitPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pieces">{t('onboarding.step2.form.units.pieces')}</SelectItem>
            <SelectItem value="kg">{t('onboarding.step2.form.units.kg')}</SelectItem>
            <SelectItem value="liters">{t('onboarding.step2.form.units.liters')}</SelectItem>
            <SelectItem value="meters">{t('onboarding.step2.form.units.meters')}</SelectItem>
            <SelectItem value="boxes">{t('onboarding.step2.form.units.boxes')}</SelectItem>
          </SelectContent>
        </Select>
        {errors.unit && <p className="text-sm text-red-500 mt-1">{errors.unit}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t('loading') : t('onboarding.buttons.continue')}
      </Button>
    </form>
  );
};
