import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n/TranslationProvider';
import { Building2, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import { useDirectionClasses } from '../../lib/translation';

interface BranchFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  is_active: boolean;
}

const BranchEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('branches');
  const { isRTL } = useDirectionClasses();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<BranchFormData>({
    name: '',
    code: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    is_active: true,
  });

  useEffect(() => {
    loadBranch();
  }, [id]);

  const loadBranch = async () => {
    try {
      setLoading(true);
      console.log('Loading branch with ID:', id);
      const response = await api.get(`/business/branches/${id}`);
      console.log('Full API response:', response);
      console.log('Response data:', response.data);
      
      // The API returns { branch: {...} } not just the branch object
      const branch = response.data.branch || response.data;
      console.log('Branch object:', branch);
      
      const loadedData = {
        name: branch.name || '',
        code: branch.code || '',
        address: branch.address || '',
        city: branch.city || '',
        phone: branch.phone || '',
        email: branch.email || '',
        is_active: branch.is_active ?? true,
      };
      
      console.log('Setting form data:', loadedData);
      setFormData(loadedData);
    } catch (error: any) {
      console.error('Failed to load branch:', error);
      console.error('Error response:', error.response);
      setError(error.response?.data?.message || 'Failed to load branch');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.put(`/business/branches/${id}`, formData);
      navigate('/business/branches');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update branch');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof BranchFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className={`flex items-center mb-4 ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
            <button
              onClick={() => navigate('/business/branches')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors shadow-sm"
            >
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('editBranch', { fallback: 'Edit Branch' })}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {t('editBranchDesc', { fallback: 'Update branch information' })}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-8">
            {error && (
              <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  {t('basicInfo', { fallback: 'Basic Information' })}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('name', { fallback: 'Branch Name' })} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                      placeholder={t('namePlaceholder', { fallback: 'Enter branch name' })}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('code', { fallback: 'Branch Code' })} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleChange('code', e.target.value)}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                      placeholder={t('codePlaceholder', { fallback: 'e.g., BR-001' })}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('city', { fallback: 'City' })}
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                      placeholder={t('cityPlaceholder', { fallback: 'Enter city' })}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  {t('contactInfo', { fallback: 'Contact Information' })}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('address', { fallback: 'Address' })}
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                      placeholder={t('addressPlaceholder', { fallback: 'Enter full address' })}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('phone', { fallback: 'Phone' })}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                      placeholder={t('phonePlaceholder', { fallback: '+966 XX XXX XXXX' })}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('email', { fallback: 'Email' })}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                      placeholder={t('emailPlaceholder', { fallback: 'branch@company.com' })}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  {t('status', { fallback: 'Status' })}
                </h3>
                <div>
                  <label className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleChange('is_active', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t('activeStatus', { fallback: 'Branch is active and operational' })}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex pt-8 mt-8 border-t border-gray-200 ${isRTL ? 'flex-row-reverse space-x-reverse space-x-4' : 'justify-end space-x-4'}`}>
              <button
                type="button"
                onClick={() => navigate('/business/branches')}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {t('cancel', { fallback: 'Cancel' })}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {saving && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {saving ? t('saving', { fallback: 'Updating Branch...' }) : t('save', { fallback: 'Update Branch' })}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BranchEdit;
