import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,

  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useTranslation, useDirectionClasses } from '@/lib/translation';
import { formatCurrency } from '@/lib/currency';
import moment from 'moment';

interface MaintenanceContract {
  id: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  contract_value?: number;
  status: string;
  special_instructions?: string;
  product: {
    id: number;
    name: string;
  };
  customer: {
    id: number;
    name: string;
  };
  assigned_technician?: {
    id: number;
    name: string;
    email: string;
  };
  visits?: MaintenanceVisit[];
}

interface MaintenanceVisit {
  id: number;
  scheduled_date: string;
  scheduled_time?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'missed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  work_description?: string;
  completion_notes?: string;
  customer_rating?: number;
  total_cost?: number;
  actual_start_time?: string;
  actual_end_time?: string;
  assigned_worker?: {
    id: number;
    name: string;
    job_title: string;
  };
}

export default function MaintenanceContractSchedule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('maintenance');
  const { isRTL } = useDirectionClasses();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<MaintenanceContract | null>(null);

  useEffect(() => {
    if (id) {
      fetchContractDetails();
    }
  }, [id]);

  const fetchContractDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/maintenance/contracts/${id}`);
      setContract(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch contract details:', error);
      toast.error(t('failedToLoadContract', { fallback: 'Failed to load contract details' }));
      navigate('/business/maintenance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'scheduled':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'missed':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <PlayCircle className="h-5 w-5 text-blue-600" />;
      case 'scheduled':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'missed':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleViewVisit = (visitId: number) => {
    navigate(`/business/maintenance/view/${visitId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <AlertCircle className="h-12 w-12 mb-4 text-yellow-500" />
        <p>{t('contractNotFound', { fallback: 'Contract not found' })}</p>
        <button
          onClick={() => navigate('/business/maintenance')}
          className="mt-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          {t('backToContracts', { fallback: 'Back to Contracts' })}
        </button>
      </div>
    );
  }

  // Sort visits by date
  const sortedVisits = [...(contract.visits || [])].sort((a, b) => 
    new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
  );

  return (
    <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <button
          onClick={() => navigate('/business/maintenance')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('backToContracts', { fallback: 'Back to Contracts' })}</span>
        </button>
        
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            {t('contractSchedule', { fallback: 'Contract Schedule' })}
          </h1>
          <p className="text-sm text-gray-500">{contract.customer_name} • {contract.product.name}</p>
        </div>
      </div>

      {/* Contract Overview */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-medium text-gray-900">{t('contractDetails', { fallback: 'Contract Details' })}</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                {t('customerInformation', { fallback: 'Customer Information' })}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('customer', { fallback: 'Customer' })}</div>
                  <div className="text-base font-medium text-gray-900">{contract.customer_name}</div>
                </div>
                
                {contract.customer_phone && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{t('phone', { fallback: 'Phone' })}</div>
                    <div className="text-base text-gray-900">{contract.customer_phone}</div>
                  </div>
                )}
                
                {contract.customer_address && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{t('address', { fallback: 'Address' })}</div>
                    <div className="text-base text-gray-900">{contract.customer_address}</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Contract Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                {t('contractInformation', { fallback: 'Contract Information' })}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('product', { fallback: 'Product' })}</div>
                  <div className="text-base font-medium text-gray-900">{contract.product.name}</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('frequency', { fallback: 'Frequency' })}</div>
                  <div className="text-base text-gray-900">{contract.frequency}</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('status', { fallback: 'Status' })}</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(contract.status)}`}>
                    {t(contract.status, { fallback: contract.status.toUpperCase() })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Timeline & Value */}
            <div className="space-y-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                {t('timeline', { fallback: 'Timeline & Value' })}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('startDate', { fallback: 'Start Date' })}</div>
                  <div className="text-base text-gray-900">{moment(contract.start_date).format('MMM DD, YYYY')}</div>
                </div>
                
                {contract.end_date && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{t('endDate', { fallback: 'End Date' })}</div>
                    <div className="text-base text-gray-900">{moment(contract.end_date).format('MMM DD, YYYY')}</div>
                  </div>
                )}
                
                {contract.contract_value && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{t('contractValue', { fallback: 'Contract Value' })}</div>
                    <div className="text-base font-semibold text-gray-900">${Number(contract.contract_value).toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {contract.assigned_technician && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">{t('assignedTechnician', { fallback: 'Assigned Technician' })}:</span>
                <span className="text-sm font-medium text-gray-900">{contract.assigned_technician.name}</span>
              </div>
            </div>
          )}

          {contract.special_instructions && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {t('specialInstructions', { fallback: 'Special Instructions' })}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{contract.special_instructions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-medium text-gray-900">{t('maintenanceTimeline', { fallback: 'Maintenance Timeline' })}</h2>
        </div>
        
        <div className="p-6">
          {sortedVisits.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">{t('noVisitsScheduled', { fallback: 'No maintenance visits scheduled yet' })}</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className={`absolute top-0 bottom-0 w-px bg-gray-200 ${isRTL ? 'right-[11px]' : 'left-[11px]'}`}></div>
              
              {/* Timeline items */}
              <div className="space-y-6">
                {sortedVisits.map((visit) => (
                  <div key={visit.id} className={`relative ${isRTL ? 'pr-10' : 'pl-10'}`}>
                    {/* Timeline dot */}
                    <div className={`absolute top-1.5 ${isRTL ? 'right-[7px]' : 'left-[7px]'} w-2.5 h-2.5 rounded-full border-2 border-white ${
                      visit.status === 'completed' ? 'bg-green-500' :
                      visit.status === 'in_progress' ? 'bg-blue-500' :
                      visit.status === 'scheduled' ? 'bg-gray-400' :
                      visit.status === 'cancelled' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`}></div>
                    
                    {/* Visit card */}
                    <div 
                      className="group bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-5 transition-all cursor-pointer"
                      onClick={() => handleViewVisit(visit.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-shrink-0">
                              {getStatusIcon(visit.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-medium text-gray-900">
                                {t('visit', { fallback: 'Visit' })} #{visit.id}
                              </h3>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {moment(visit.scheduled_date).format('MMMM DD, YYYY')}
                                {visit.scheduled_time && ` • ${visit.scheduled_time}`}
                              </p>
                            </div>
                          </div>
                          
                          {/* Status badges */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(visit.status)}`}>
                              {t(visit.status, { fallback: visit.status.replace('_', ' ').toUpperCase() })}
                            </span>
                            
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(visit.priority)}`}>
                              {t(visit.priority, { fallback: visit.priority.toUpperCase() })}
                            </span>
                            
                            {visit.assigned_worker && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                <User className="h-3 w-3" />
                                {visit.assigned_worker.name}
                              </span>
                            )}
                          </div>
                          
                          {/* Description */}
                          {visit.work_description && (
                            <p className="text-base text-gray-600 line-clamp-2 mb-3">
                              {visit.work_description}
                            </p>
                          )}
                          
                          {/* Completion details */}
                          {visit.status === 'completed' && (
                            <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                              {visit.actual_end_time && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                  <span>{moment(visit.actual_end_time).format('MMM DD, h:mm A')}</span>
                                </div>
                              )}
                              
                              {visit.total_cost && (
                                <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  <span>{formatCurrency(Number(visit.total_cost))}</span>
                                </div>
                              )}
                              
                              {visit.customer_rating && (
                                <div className="flex items-center gap-1 text-xs text-yellow-600">
                                  <span>⭐ {visit.customer_rating}/5</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* View arrow */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowLeft className={`h-4 w-4 text-gray-400 ${isRTL ? '' : 'rotate-180'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
