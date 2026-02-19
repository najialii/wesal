import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n/TranslationProvider';
import { Plus, Building2, MapPin, Phone, Mail } from 'lucide-react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { useDirectionClasses } from '../../lib/translation';

interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

const Branches: React.FC = () => {
  const { t } = useTranslation('branches');
  const { isRTL } = useDirectionClasses();
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBranches();
  }, [search]);

  const loadBranches = async () => {
    try {
      const res = await api.get('/business/branches', {
        params: { search }
      });
      // API returns { branches: [], total: number }
      const branchesData = res.data?.branches || [];
      setBranches(branchesData);
    } catch (error) {
      console.error('Failed to load branches:', error);
      setBranches([]); // Ensure branches is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setShowModal(true);
  };

  const handleEdit = (branchId: number) => {
    navigate(`/business/branches/${branchId}/edit`);
  };

  const handleDelete = async (branch: Branch) => {
    if (branch.is_default) {
      alert(t('cannotDeleteDefault', { fallback: 'Cannot delete the default branch' }));
      return;
    }

    if (!confirm(t('confirmDelete', { fallback: 'Are you sure you want to delete this branch?' }))) {
      return;
    }

    try {
      await api.delete(`/business/branches/${branch.id}`);
      loadBranches();
    } catch (error: any) {
      alert(error.response?.data?.message || t('deleteError', { fallback: 'Failed to delete branch' }));
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      {/* Header */}
      <div className={`flex items-center ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('subtitle')}
          </p>
        </div>
        <button 
          onClick={handleCreate}
          className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transform hover:scale-[1.02] transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <PlusIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('addBranch')}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <MagnifyingGlassIcon className={`h-5 w-5 absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-4' : 'left-4'}`} />
          <input
            type="text"
            placeholder={t('searchBranches', { fallback: 'Search branches...' })}
            className={`w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} py-3 text-sm`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : !Array.isArray(branches) || branches.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Building2 className="h-10 w-10 text-gray-400" />
          </div>
          <div className="text-gray-500">
            <h3 className="text-xl font-semibold mb-2">{t('noBranches')}</h3>
            <p className="text-sm mb-4">{t('noBranchesDesc')}</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('addBranch')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {branches.map((branch) => (
            <div 
              key={branch.id} 
              className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-primary-300 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Header with Icon and Actions */}
              <div className={`flex items-start gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-bold text-gray-900 truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                    {branch.name}
                  </h3>
                  <p className={`text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {branch.code}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      branch.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {branch.is_active ? t('active', { fallback: 'Active' }) : t('inactive', { fallback: 'Inactive' })}
                    </span>
                    {branch.is_default && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {t('default')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={`flex gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button 
                    onClick={() => handleEdit(branch.id)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                    title={t('edit', { fallback: 'Edit' })}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  {!branch.is_default && (
                    <button 
                      onClick={() => handleDelete(branch)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title={t('delete', { fallback: 'Delete' })}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Branch Details */}
              <div className="space-y-2 mb-4">
                {branch.address && (
                  <div className={`flex items-start gap-2 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{branch.address}, {branch.city}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className={`flex items-center gap-2 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className={`flex items-center gap-2 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{branch.email}</span>
                  </div>
                )}
              </div>
              
              {/* Footer with View Button */}
              <div className={`flex items-center justify-between pt-4 border-t border-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => window.location.href = `/business/branches/${branch.id}`}
                  className="flex-1 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-200"
                >
                  {t('viewDetails', { fallback: 'View Details' })}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <BranchModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadBranches();
          }}
        />
      )}
    </div>
  );
};

interface BranchModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const BranchModal: React.FC<BranchModalProps> = ({ onClose, onSuccess }) => {
  const { t } = useTranslation('branches');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/business/branches', formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save branch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">
          {t('addBranch')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('name')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('code')} *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('address')}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('city')}
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('phone')}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('email')}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Branches;
