import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  MapPinIcon, 
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  PlayIcon,
  CheckCircleIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '@/lib/i18n/TranslationProvider';
import { technicianService, TechnicianVisit } from '@/services/technician';
import { toast } from 'sonner';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import CompleteVisitModal from '@/components/technician/CompleteVisitModal';

export default function VisitDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation('technician');
  const [visit, setVisit] = useState<TechnicianVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadVisit();
    }
  }, [id]);

  const loadVisit = async () => {
    try {
      setLoading(true);
      const data = await technicianService.getVisit(Number(id));
      setVisit(data);
    } catch (error) {
      console.error('Failed to load visit:', error);
      toast.error(t('messages.failed_to_load', { fallback: 'Failed to load visit details' }));
      navigate('/technician/visits');
    } finally {
      setLoading(false);
    }
  };

  const handleStartVisit = async () => {
    if (!visit) return;
    
    try {
      setStarting(true);
      await technicianService.startVisit(visit.id);
      toast.success(t('messages.visit_started', { fallback: 'Visit started successfully' }));
      await loadVisit();
    } catch (error: any) {
      console.error('Failed to start visit:', error);
      toast.error(error.response?.data?.message || t('messages.failed_to_start', { fallback: 'Failed to start visit' }));
    } finally {
      setStarting(false);
    }
  };

  const handleCompleteSuccess = () => {
    setShowCompleteModal(false);
    toast.success(t('messages.visit_completed', { fallback: 'Visit completed successfully' }));
    navigate('/technician');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      missed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'text-red-600 bg-red-50 border-red-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      low: 'text-gray-600 bg-gray-50 border-gray-200',
    };
    return colors[priority] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!visit) {
    return null;
  }

  const canStart = visit.status === 'scheduled';
  const canComplete = visit.status === 'in_progress';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <button
          onClick={() => navigate('/technician/visits')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex-1">
          <div className={`flex items-center gap-3 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('visit_details.title', { fallback: 'Visit Details' })}
            </h1>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(visit.status)}`}>
              {t(`status.${visit.status}`, { fallback: visit.status })}
            </span>
            <span className={`text-xs font-medium px-3 py-1 rounded border ${getPriorityColor(visit.priority)}`}>
              {visit.priority.toUpperCase()} {t('visit_details.priority', { fallback: 'PRIORITY' })}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {(canStart || canComplete) && (
        <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {canStart && (
            <button
              onClick={handleStartVisit}
              disabled={starting}
              className={`flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <PlayIcon className="h-5 w-5" />
              {starting ? t('visit_details.starting', { fallback: 'Starting...' }) : t('visit_details.start_visit', { fallback: 'Start Visit' })}
            </button>
          )}
          {canComplete && (
            <button
              onClick={() => setShowCompleteModal(true)}
              className={`flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <CheckCircleIcon className="h-5 w-5" />
              {t('visit_details.complete_visit', { fallback: 'Complete Visit' })}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('visit_details.customer_info', { fallback: 'Customer Information' })}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-xl text-gray-900">
                {visit.contract?.customer?.name || visit.contract?.customer_name || 'N/A'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visit.contract?.customer?.phone && (
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                      <PhoneIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('visit_details.phone', { fallback: 'Phone' })}</p>
                      <a 
                        href={`tel:${visit.contract.customer.phone}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {visit.contract.customer.phone}
                      </a>
                    </div>
                  </div>
                )}

                {visit.contract?.customer?.email && (
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                      <EnvelopeIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('visit_details.email', { fallback: 'Email' })}</p>
                      <a 
                        href={`mailto:${visit.contract.customer.email}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {visit.contract.customer.email}
                      </a>
                    </div>
                  </div>
                )}

                {visit.contract?.customer?.address && (
                  <div className={`flex items-center gap-3 sm:col-span-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPinIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">{t('visit_details.address', { fallback: 'Address' })}</p>
                      <p className="text-sm font-medium text-gray-900">{visit.contract.customer.address}</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visit.contract.customer.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        {t('visit_details.get_directions', { fallback: 'Get Directions' })} →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Work Description */}
          {visit.work_description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h2 className={`text-lg font-semibold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                  {t('visit_details.work_description', { fallback: 'Work Description' })}
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700">{visit.work_description}</p>
              </div>
            </div>
          )}

          {/* Parts Used */}
          {visit.products && visit.products.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h2 className={`text-lg font-semibold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <CubeIcon className="h-5 w-5 text-gray-500" />
                  {t('visit_details.parts_used', { fallback: 'Parts Used' })}
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {visit.products.map((product) => (
                  <div key={product.id} className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CubeIcon className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      </div>
                    </div>
                    <div className={isRTL ? 'text-left' : 'text-right'}>
                      <p className="font-medium text-gray-900">
                        {t('visit_details.qty', { fallback: 'Qty' })}: {product.pivot.quantity}
                      </p>
                      <p className="text-sm text-gray-500">
                        <CurrencyDisplay amount={product.pivot.total_cost} />
                      </p>
                    </div>
                  </div>
                ))}
                {visit.total_cost && (
                  <div className={`flex items-center justify-between pt-3 border-t border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <p className="font-semibold text-gray-900">{t('visit_details.total_cost', { fallback: 'Total Cost' })}</p>
                    <p className="font-semibold text-lg text-gray-900">
                      {formatCurrency(visit.total_cost)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Completion Notes */}
          {visit.completion_notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('visit_details.completion_notes', { fallback: 'Completion Notes' })}
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 whitespace-pre-wrap">{visit.completion_notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Schedule Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h2 className={`text-lg font-semibold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                {t('visit_details.schedule', { fallback: 'Schedule' })}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('visit_details.scheduled_date', { fallback: 'Scheduled Date' })}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(visit.scheduled_date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('visit_details.scheduled_time', { fallback: 'Scheduled Time' })}</p>
                  <p className="text-sm font-medium text-gray-900">{visit.scheduled_time}</p>
                </div>
              </div>

              {visit.actual_start_time && (
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <PlayIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('visit_details.started_at', { fallback: 'Started At' })}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(visit.actual_start_time).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                </div>
              )}

              {visit.actual_end_time && (
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('visit_details.completed_at', { fallback: 'Completed At' })}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(visit.actual_end_time).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Branch Card */}
          {visit.branch && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h2 className={`text-lg font-semibold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <BuildingStorefrontIcon className="h-5 w-5 text-gray-500" />
                  {t('visit_details.branch', { fallback: 'Branch' })}
                </h2>
              </div>
              <div className="p-6">
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BuildingStorefrontIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{visit.branch.name}</p>
                    <p className="text-sm text-gray-500">{visit.branch.code}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Visit Modal */}
      {showCompleteModal && (
        <CompleteVisitModal
          visitId={visit.id}
          onClose={() => setShowCompleteModal(false)}
          onSuccess={handleCompleteSuccess}
        />
      )}
    </div>
  );
}
