import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../lib/i18n/TranslationProvider';
import { Plus, Building2, MapPin, Phone, Mail, Edit, Power, PowerOff } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/EmptyState';

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
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const res = await api.get('/business/branches');
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
    setEditingBranch(null);
    setShowModal(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setShowModal(true);
  };

  const handleToggleStatus = async (branch: Branch) => {
    try {
      if (branch.is_active) {
        await api.delete(`/business/branches/${branch.id}`);
      } else {
        await api.post(`/business/branches/${branch.id}/activate`);
      }
      loadBranches();
    } catch (error) {
      console.error('Failed to toggle branch status:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          {t('addBranch')}
        </Button>
      </div>

      {!Array.isArray(branches) || branches.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t('noBranches')}
          description={t('noBranchesDesc')}
          action={{
            label: t('addBranch'),
            onClick: handleCreate
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(branches) && branches.map((branch) => (
            <Card key={branch.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${branch.is_active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Building2 className={`w-5 h-5 ${branch.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                    <p className="text-sm text-gray-500">{branch.code}</p>
                  </div>
                </div>
                {branch.is_default && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                    {t('default')}
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {branch.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{branch.address}, {branch.city}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span>{branch.email}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = `/business/branches/${branch.id}`}
                  className="flex-1"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(branch)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                {!branch.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(branch)}
                    className={branch.is_active ? 'text-red-600' : 'text-green-600'}
                  >
                    {branch.is_active ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <BranchModal
          branch={editingBranch}
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
  branch: Branch | null;
  onClose: () => void;
  onSuccess: () => void;
}

const BranchModal: React.FC<BranchModalProps> = ({ branch, onClose, onSuccess }) => {
  const { t } = useTranslation('branches');
  const [formData, setFormData] = useState({
    name: branch?.name || '',
    code: branch?.code || '',
    address: branch?.address || '',
    city: branch?.city || '',
    phone: branch?.phone || '',
    email: branch?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (branch) {
        await api.put(`/business/branches/${branch.id}`, formData);
      } else {
        await api.post('/business/branches', formData);
      }
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
          {branch ? t('editBranch') : t('addBranch')}
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
