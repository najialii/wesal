import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n/TranslationProvider';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Edit, 
  Power, 
  PowerOff, 
  ArrowLeft,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Calendar,
  Wrench
} from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { KPICard } from '../../components/dashboard/KPICard';
import { formatCurrency } from '../../lib/currency';
import { toast } from 'sonner';

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

interface BranchSummary {
  branch: Branch;
  products: {
    total: number;
    low_stock: number;
    total_stock_units: number;
  };
  sales: {
    total_count: number;
    total_revenue: number;
    today_count: number;
    today_revenue: number;
  };
  maintenance: {
    active_contracts: number;
    pending_visits: number;
  };
  staff: {
    count: number;
  };
  warnings: {
    has_low_stock: boolean;
    low_stock_count: number;
  };
}

const BranchView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('branches');
  const [summary, setSummary] = useState<BranchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadBranchSummary();
    }
  }, [id]);

  const loadBranchSummary = async () => {
    try {
      // Fetch branch details - API returns { branch: {...} }
      const branchRes = await api.get(`/business/branches/${id}`);
      const branchData = branchRes.data.branch || branchRes.data;
      
      // Create summary object with branch data
      // For now, we'll use mock data for stats until the summary endpoint is created
      setSummary({
        branch: branchData,
        products: {
          total: 0,
          low_stock: 0,
          total_stock_units: 0,
        },
        sales: {
          total_count: 0,
          total_revenue: 0,
          today_count: 0,
          today_revenue: 0,
        },
        maintenance: {
          active_contracts: 0,
          pending_visits: 0,
        },
        staff: {
          count: 0,
        },
        warnings: {
          has_low_stock: false,
          low_stock_count: 0,
        },
      });
    } catch (error) {
      console.error('Failed to load branch summary:', error);
      toast.error('Failed to load branch details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!summary) return;
    
    setActionLoading(true);
    try {
      if (summary.branch.is_active) {
        await api.delete(`/business/branches/${id}`);
        toast.success(t('branchDeactivated'));
      } else {
        await api.post(`/business/branches/${id}/activate`);
        toast.success(t('branchActivated'));
      }
      loadBranchSummary();
    } catch (error) {
      console.error('Failed to toggle branch status:', error);
      toast.error('Failed to update branch status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/business/branches/${id}/edit`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Branch not found</div>
      </div>
    );
  }

  const { branch } = summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/business/branches')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Branches
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${branch.is_active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Building2 className={`w-6 h-6 ${branch.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              {branch.name}
              {branch.is_default && (
                <span className="px-2 py-1 text-sm font-medium bg-green-100 text-green-700 rounded">
                  {t('common.default')}
                </span>
              )}
            </h1>
            <p className="text-gray-600">{branch.code}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            {t('common.edit')}
          </Button>
          {!branch.is_default && (
            <Button
              variant="outline"
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={branch.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
            >
              {branch.is_active ? (
                <>
                  <PowerOff className="w-4 h-4 mr-2" />
                  {t('common.deactivate')}
                </>
              ) : (
                <>
                  <Power className="w-4 h-4 mr-2" />
                  {t('common.activate')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Branch Details Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">{t('branchDetails')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Address</p>
                <p className="text-gray-600">
                  {branch.address || 'No address provided'}
                </p>
                {branch.city && <p className="text-gray-600">{branch.city}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Phone</p>
                <p className="text-gray-600">
                  {branch.phone || 'No phone provided'}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-gray-600">
                  {branch.email || 'No email provided'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Created</p>
                <p className="text-gray-600">
                  {new Date(branch.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          label="Products"
          value={summary.products.total}
          icon={Package}
          trend={summary.warnings.has_low_stock ? 'down' : 'up'}
          change={summary.warnings.has_low_stock ? `${summary.warnings.low_stock_count} low stock` : 'All in stock'}
        />
        
        <KPICard
          label="Total Sales"
          value={summary.sales.total_count}
          icon={ShoppingCart}
          trend="up"
          change={`${summary.sales.today_count} today`}
        />
        
        <KPICard
          label="Revenue"
          value={formatCurrency(summary.sales.total_revenue)}
          icon={DollarSign}
          trend="up"
          change={`${formatCurrency(summary.sales.today_revenue)} today`}
        />
        
        <KPICard
          label="Staff"
          value={summary.staff.count}
          icon={Users}
          trend="neutral"
          change="Active staff members"
        />
      </div>

      {/* Maintenance & Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Maintenance
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Contracts</span>
              <span className="font-semibold">{summary.maintenance.active_contracts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Visits</span>
              <span className="font-semibold">{summary.maintenance.pending_visits}</span>
            </div>
          </div>
        </Card>

        {summary.warnings.has_low_stock && (
          <Card className="p-6 border-orange-200 bg-orange-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Warnings
            </h3>
            <div className="space-y-2">
              <p className="text-orange-700">
                {summary.warnings.low_stock_count} products are running low on stock
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/business/products?filter=low-stock')}
                className="text-orange-700 border-orange-300 hover:bg-orange-100"
              >
                View Low Stock Items
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BranchView;