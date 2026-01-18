import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { useTranslation } from '../../lib/translation';

interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order?: number;
}

interface CategoryModalProps {
  category?: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoryModal({ category, onClose, onSuccess }: CategoryModalProps) {
  const { t } = useTranslation('categories');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    sort_order: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        is_active: category.is_active ?? true,
        sort_order: category.sort_order || 0
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (category) {
        await api.put(`/tenant/categories/${category.id}`, formData);
      } else {
        await api.post('/tenant/categories', formData);
      }
      onSuccess();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ 
          general: error.response?.data?.message || t('saveError', { fallback: 'Failed to save category' })
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {category ? t('editCategory') : t('addCategory')}
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
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              {t('name')} *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                errors.name ? 'border-red-300' : ''
              }`}
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              {t('description')}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                errors.description ? 'border-red-300' : ''
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700">
              {t('sortOrder', { fallback: 'Sort Order' })}
            </label>
            <input
              type="number"
              id="sort_order"
              name="sort_order"
              value={formData.sort_order}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                errors.sort_order ? 'border-red-300' : ''
              }`}
            />
            {errors.sort_order && (
              <p className="mt-1 text-sm text-red-600">{errors.sort_order[0]}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              {t('active', { fallback: 'Active' })}
            </label>
          </div>

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