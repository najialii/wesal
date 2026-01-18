import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { useTranslation, useDirectionClasses } from '@/lib/translation';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { getProductImageUrl } from '@/lib/imageUtils';
import moment from 'moment';

interface MaintenanceContract {
  id: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  product: {
    id: number;
    name: string;
    sku: string;
    image?: string;
  };
  assignedTechnician?: {
    id: number;
    name: string;
    email: string;
  };
  frequency: string;
  frequency_value?: number;
  frequency_unit?: string;
  start_date: string;
  end_date?: string;
  contract_value?: number;
  special_instructions?: string;
  status: string;
  items: Array<{
    id: number;
    product: {
      id: number;
      name: string;
      sku: string;
    };
    quantity: number;
    unit_cost: number;
  }>;
  visits: Array<{
    id: number;
    scheduled_date: string;
    status: string;
  }>;
}

export default function MaintenanceContractView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('maintenance');
  const { isRTL } = useDirectionClasses();
  const [contract, setContract] = useState<MaintenanceContract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchContract();
    }
  }, [id]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/maintenance/contracts/${id}`);
      setContract(response.data.data);
    } catch (error) {
      console.error('Failed to fetch contract:', error);
      toast.error(t('failedToLoadContract', { fallback: 'Failed to load contract' }));
      navigate('/business/maintenance');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contract) return;
    
    if (!confirm(t('deleteConfirmation', { fallback: `Delete maintenance contract for ${contract.customer_name}?` }))) return;

    try {
      await api.delete(`/maintenance/contracts/${contract.id}`);
      toast.success(t('contractDeleted', { fallback: 'Contract deleted successfully' }));
      navigate('/business/maintenance');
    } catch (error) {
      console.error('Failed to delete contract:', error);
      toast.error(t('failedToDelete', { fallback: 'Failed to delete contract' }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      once: t('once', { fallback: 'One Time' }),
      weekly: t('weekly', { fallback: 'Weekly' }),
      monthly: t('monthly', { fallback: 'Monthly' }),
      quarterly: t('quarterly', { fallback: 'Quarterly' }),
      semi_annual: t('semiAnnual', { fallback: 'Semi-Annual' }),
      annual: t('annual', { fallback: 'Annual' }),
      custom: t('custom', { fallback: 'Custom' }),
    };
    return labels[frequency] || frequency;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: t('active', { fallback: 'Active' }),
      paused: t('paused', { fallback: 'Paused' }),
      completed: t('completed', { fallback: 'Completed' }),
      cancelled: t('cancelled', { fallback: 'Cancelled' }),
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('contractNotFound', { fallback: 'Contract not found' })}</h2>
          <button
            onClick={() => navigate('/business/maintenance')}
            className="text-primary-600 hover:text-primary-800"
          >
            {t('backToContracts', { fallback: 'Back to Contracts' })}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className={`flex items-center justify-between mb-4`}>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
              <button
                onClick={() => navigate('/business/maintenance')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors shadow-sm"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('contractDetails', { fallback: 'Contract Details' })}</h1>
                <p className="mt-2 text-sm text-gray-600">
                  {t('viewContractDetails', { fallback: 'View maintenance contract information and schedule' })}
                </p>
              </div>
            </div>
            
            <div className={`flex ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <button
                onClick={() => navigate(`/business/maintenance/schedule/${contract.id}`)}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <CalendarIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('viewSchedule', { fallback: 'View Schedule' })}
              </button>
              <button
                onClick={() => navigate(`/business/maintenance/edit/${contract.id}`)}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <PencilIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('edit', { fallback: 'Edit' })}
              </button>
              <button
                onClick={handleDelete}
                className={`inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <TrashIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('delete', { fallback: 'Delete' })}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className={`flex items-center justify-between mb-6`}>
                <h2 className="text-xl font-semibold text-gray-900">{t('contractDetails', { fallback: 'Contract Details' })}</h2>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                  {getStatusLabel(contract.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('frequency', { fallback: 'Frequency' })}</label>
                  <div className="text-lg font-semibold text-gray-900">{getFrequencyLabel(contract.frequency)}</div>
                  {contract.frequency === 'custom' && contract.frequency_value && contract.frequency_unit && (
                    <div className="text-sm text-gray-500">
                      {t('every', { fallback: 'Every' })} {contract.frequency_value} {contract.frequency_unit}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('contractValue', { fallback: 'Contract Value' })}</label>
                  <div className="text-lg font-semibold text-gray-900">
                    {contract.contract_value ? formatCurrency(Number(contract.contract_value)) : '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('startDate', { fallback: 'Start Date' })}</label>
                  <div className="text-lg font-semibold text-gray-900">
                    {moment(contract.start_date).format('MMM DD, YYYY')}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('endDate', { fallback: 'End Date' })}</label>
                  <div className="text-lg font-semibold text-gray-900">
                    {contract.end_date ? moment(contract.end_date).format('MMM DD, YYYY') : t('noEndDate', { fallback: 'No end date' })}
                  </div>
                </div>
              </div>

              {contract.special_instructions && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-600 mb-2">{t('specialInstructions', { fallback: 'Special Instructions' })}</label>
                  <div className="text-gray-900 bg-gray-50 rounded-lg p-4">
                    {contract.special_instructions}
                  </div>
                </div>
              )}
            </div>

            {/* Product Being Maintained */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('productBeingMaintained', { fallback: 'Product Being Maintained' })}</h2>
              
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  <img
                    src={getProductImageUrl(contract.product)}
                    alt={contract.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{contract.product.name}</h3>
                  <p className="text-sm text-gray-500">SKU: {contract.product.sku}</p>
                </div>
              </div>
            </div>

            {/* Maintenance Items */}
            {contract.items && contract.items.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('maintenanceItems', { fallback: 'Maintenance Items' })}</h2>
                
                <div className="space-y-4">
                  {contract.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                        <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {t('quantity', { fallback: 'Qty' })}: {item.quantity}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.unit_cost)} {t('each', { fallback: 'each' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">{t('totalItemsCost', { fallback: 'Total Items Cost' })}</span>
                      <span className="text-lg font-bold text-primary-600">
                        {formatCurrency(contract.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('customerInformation', { fallback: 'Customer Information' })}</h2>
              
              <div className="space-y-4">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                  <UserIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{contract.customer_name}</div>
                  </div>
                </div>

                {contract.customer_phone && (
                  <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-gray-900">{contract.customer_phone}</div>
                    </div>
                  </div>
                )}

                {contract.customer_address && (
                  <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-gray-900">{contract.customer_address}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Technician */}
            {contract.assignedTechnician && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('assignedTechnician', { fallback: 'Assigned Technician' })}</h2>
                
                <div className="space-y-4">
                  <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{contract.assignedTechnician.name}</div>
                      <div className="text-sm text-gray-500">{contract.assignedTechnician.email}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Visits */}
            {contract.visits && contract.visits.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('recentVisits', { fallback: 'Recent Visits' })}</h2>
                
                <div className="space-y-3">
                  {contract.visits.slice(0, 5).map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <div className="text-sm text-gray-900">
                          {moment(visit.scheduled_date).format('MMM DD, YYYY')}
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        visit.status === 'completed' ? 'bg-green-100 text-green-800' :
                        visit.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {visit.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}