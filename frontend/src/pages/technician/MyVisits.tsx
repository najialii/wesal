import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  MapPinIcon, 
  PhoneIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '@/lib/i18n/TranslationProvider';
import { technicianService, TechnicianVisit } from '@/services/technician';
import { toast } from 'sonner';

export default function MyVisits() {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation('technician');
  const [visits, setVisits] = useState<TechnicianVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadVisits();
  }, [statusFilter]);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const data = await technicianService.getVisits(filters);
      setVisits(data.visits);
    } catch (error) {
      console.error('Failed to load visits:', error);
      toast.error(t('messages.failed_to_load', { fallback: 'Failed to load visits' }));
    } finally {
      setLoading(false);
    }
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
      urgent: 'text-red-600 bg-red-50',
      high: 'text-orange-600 bg-orange-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-gray-600 bg-gray-50',
    };
    return colors[priority] || 'text-gray-600 bg-gray-50';
  };

  const filteredVisits = visits.filter(visit => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (visit.contract?.customer?.name || visit.contract?.customer_name || '').toLowerCase().includes(query) ||
      visit.contract?.customer?.phone?.toLowerCase().includes(query) ||
      visit.contract?.customer_phone?.toLowerCase().includes(query) ||
      visit.work_description?.toLowerCase().includes(query)
    );
  });

  const statusOptions = [
    { value: 'all', label: t('filters.all', { fallback: 'All Visits' }) },
    { value: 'scheduled', label: t('status.scheduled', { fallback: 'Scheduled' }) },
    { value: 'in_progress', label: t('status.in_progress', { fallback: 'In Progress' }) },
    { value: 'completed', label: t('status.completed', { fallback: 'Completed' }) },
  ];

  if (loading) {
    return (
      <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('visits.title', { fallback: 'My Visits' })}
        </h1>
        <p className="text-gray-500 mt-1">
          {t('visits.subtitle', { fallback: 'View and manage your assigned maintenance visits' })}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className={`flex flex-col sm:flex-row gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className={`h-5 w-5 absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder={t('visits.search_placeholder', { fallback: 'Search by customer name, phone...' })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all py-3 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className={`flex gap-2 overflow-x-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visits List */}
      {filteredVisits.length > 0 ? (
        <div className="space-y-4">
          {filteredVisits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer"
              onClick={() => navigate(`/technician/visits/${visit.id}`)}
            >
              <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className={`flex items-center gap-3 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {visit.contract?.customer?.name || visit.contract?.customer_name || 'N/A'}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(visit.status)}`}>
                      {t(`status.${visit.status}`, { fallback: visit.status })}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getPriorityColor(visit.priority)}`}>
                      {visit.priority.toUpperCase()}
                    </span>
                  </div>

                  {/* Details */}
                  <div className={`flex flex-wrap gap-4 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>{new Date(visit.scheduled_date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <ClockIcon className="h-4 w-4" />
                      <span>{visit.scheduled_time}</span>
                    </div>
                    {(visit.contract?.customer?.phone || visit.contract?.customer_phone) && (
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <PhoneIcon className="h-4 w-4" />
                        <a 
                          href={`tel:${visit.contract?.customer?.phone || visit.contract?.customer_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-primary-600"
                        >
                          {visit.contract?.customer?.phone || visit.contract?.customer_phone}
                        </a>
                      </div>
                    )}
                    {(visit.contract?.customer?.address || visit.contract?.customer_address) && (
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <MapPinIcon className="h-4 w-4" />
                        <span className="truncate max-w-xs">{visit.contract?.customer?.address || visit.contract?.customer_address}</span>
                      </div>
                    )}
                    {visit.branch && (
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <BuildingStorefrontIcon className="h-4 w-4" />
                        <span>{visit.branch.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Work Description */}
                  {visit.work_description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {visit.work_description}
                    </p>
                  )}
                </div>

                <ChevronRightIcon className={`h-5 w-5 text-gray-400 flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <CalendarDaysIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            {t('visits.no_visits', { fallback: 'No visits found' })}
          </h3>
          <p className="text-gray-500 mt-1">
            {searchQuery 
              ? t('visits.try_different_search', { fallback: 'Try adjusting your search or filters' })
              : t('visits.no_visits_description', { fallback: 'You have no visits matching the selected filter' })
            }
          </p>
        </div>
      )}
    </div>
  );
}
