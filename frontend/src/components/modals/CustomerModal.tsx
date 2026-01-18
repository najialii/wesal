import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { useTranslation } from '../../lib/translation';

interface Customer {
  id?: number;
  name: string;
  phone?: string;
  secondary_phone?: string;
  address?: string;
  email?: string;
  type: 'individual' | 'business';
  tax_number?: string;
  credit_limit: number | string;
  current_balance?: number | string;
  is_active: boolean;
  notes?: string;
}

interface CustomerModalProps {
  customer?: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomerModal({ customer, onClose, onSuccess }: CustomerModalProps) {
  const { t } = useTranslation('customers');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Customer>({
    name: '',
    phone: '',
    secondary_phone: '',
    address: '',
    email: '',
    type: 'individual',
    tax_number: '',
    credit_limit: 0,
    current_balance: 0,
    is_active: true,
    notes: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        ...customer,
        phone: customer.phone || '',
        secondary_phone: customer.secondary_phone || '',
        address: customer.address || '',
        email: customer.email || '',
        tax_number: customer.tax_number || '',
        notes: customer.notes || '',
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        // Remove empty strings
        phone: formData.phone || null,
        secondary_phone: formData.secondary_phone || null,
        address: formData.address || null,
        email: formData.email || null,
        tax_number: formData.tax_number || null,
        notes: formData.notes || null,
      };

      if (customer?.id) {
        await api.put(`/tenant/customers/${customer.id}`, payload);
      } else {
        await api.post('/tenant/customers', payload);
      }

      onSuccess();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ 
          general: error.response?.data?.message || t('saveError', { fallback: 'Failed to save customer' })
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked 
              : type === 'number' ? parseFloat(value) || 0 
              : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {customer?.id ? t('editCustomer', { fallback: 'Edit Customer' }) : t('addCustomer', { fallback: 'Add Customer' })}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t('name', { fallback: 'Name' })} *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                  errors.name ? 'border-red-300' : ''
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                {t('type', { fallback: 'Type' })} *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="individual">{t('individual', { fallback: 'Individual' })}</option>
                <option value="business">{t('business', { fallback: 'Business' })}</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                {t('phone', { fallback: 'Phone' })}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                  errors.phone ? 'border-red-300' : ''
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone[0]}</p>
              )}
            </div>

            {/* Secondary Phone */}
            <div>
              <label htmlFor="secondary_phone" className="block text-sm font-medium text-gray-700">
                {t('secondaryPhone', { fallback: 'Secondary Phone' })}
              </label>
              <input
                type="tel"
                id="secondary_phone"
                name="secondary_phone"
                value={formData.secondary_phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('email', { fallback: 'Email' })}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                  errors.email ? 'border-red-300' : ''
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
              )}
            </div>

            {/* Credit Limit */}
            <div>
              <label htmlFor="credit_limit" className="block text-sm font-medium text-gray-700">
                {t('creditLimit', { fallback: 'Credit Limit' })}
              </label>
              <input
                type="number"
                id="credit_limit"
                name="credit_limit"
                min="0"
                step="0.01"
                value={formData.credit_limit}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            {/* Current Balance (for editing) */}
            {customer?.id && (
              <div>
                <label htmlFor="current_balance" className="block text-sm font-medium text-gray-700">
                  {t('currentBalance', { fallback: 'Current Balance' })}
                </label>
                <input
                  type="number"
                  id="current_balance"
                  name="current_balance"
                  step="0.01"
                  value={formData.current_balance}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            )}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              {t('address', { fallback: 'Address' })}
            </label>
            <textarea
              id="address"
              name="address"
              rows={2}
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              {t('notes', { fallback: 'Notes' })}
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              {t('active', { fallback: 'Active' })}
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('cancel', { fallback: 'Cancel' })}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? t('saving', { fallback: 'Saving...' }) : t('save', { fallback: 'Save' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}