import { useEffect, useState } from 'react';
import { 
  CalendarIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useTranslation, useDirectionClasses } from '@/lib/translation';
import { EnhancedCalendar, CalendarView } from '@/components/ui/EnhancedCalendar';
import { MaintenanceScheduleModal } from '@/components/modals/MaintenanceScheduleModal';
import { MaintenanceDetailModal } from '@/components/modals/MaintenanceDetailModal';
import moment from 'moment';

interface MaintenanceVisit {
  id: number;
  scheduled_date: string;
  scheduled_time?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'missed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  work_description?: string;
  maintenance_contract: {
    id: number;
    customer_name: string;
    product: {
      name: string;
    };
  };
  assigned_worker?: {
    id: number;
    name: string;
    job_title: string;
  };
}

interface FilterOptions {
  status: string;
  priority: string;
  technician: string;
  search: string;
}

export default function MaintenanceCalendar() {
  const { t } = useTranslation('maintenance');
  const { isRTL } = useDirectionClasses();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<MaintenanceVisit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<MaintenanceVisit[]>([]);
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    priority: '',
    technician: '',
    search: ''
  });
  const [technicians, setTechnicians] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    fetchVisits();
    fetchTechnicians();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [visits, filters]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const response = await api.get('/maintenance/visits', {
        params: {
          per_page: 1000,
          include: 'maintenance_contract,maintenance_contract.customer,maintenance_contract.product,assigned_worker'
        }
      });
      
      const visitsData = response.data.data?.data || response.data.data || [];
      setVisits(Array.isArray(visitsData) ? visitsData : []);
    } catch (error: any) {
      console.error('Failed to fetch visits:', error);
      toast.error(t('failedToLoadVisits', { fallback: 'Failed to load maintenance visits' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await api.get('/maintenance/workers');
      const technicianData = response.data.workers || [];
      setTechnicians(technicianData);
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...visits];

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(visit => visit.status === filters.status);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(visit => visit.priority === filters.priority);
    }

    // Technician filter
    if (filters.technician) {
      filtered = filtered.filter(visit => 
        visit.assigned_worker?.id.toString() === filters.technician
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(visit =>
        visit.maintenance_contract.customer_name.toLowerCase().includes(searchLower) ||
        visit.maintenance_contract.product.name.toLowerCase().includes(searchLower) ||
        visit.work_description?.toLowerCase().includes(searchLower) ||
        visit.assigned_worker?.name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredVisits(filtered);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      technician: '',
      search: ''
    });
  };

  const convertVisitsToEvents = () => {
    return filteredVisits.map(visit => ({
      id: visit.id,
      date: new Date(visit.scheduled_date),
      title: `${visit.maintenance_contract.customer_name} - ${visit.maintenance_contract.product.name}`,
      status: visit.status,
      priority: visit.priority,
      time: visit.scheduled_time,
      type: 'maintenance'
    }));
  };

  const handleEventClick = (eventId: number | string) => {
    const visitId = typeof eventId === 'string' ? parseInt(eventId) : eventId;
    setSelectedVisitId(visitId);
    setShowDetailModal(true);
    setHighlightedEventId(visitId);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (currentView !== 'day') {
      setCurrentView('day');
    }
  };

  const handleScheduleSuccess = () => {
    fetchVisits();
    setShowScheduleModal(false);
    toast.success(t('visitScheduledSuccessfully', { fallback: 'Maintenance visit scheduled successfully' }));
  };

  const getStatusStats = () => {
    const stats = {
      total: filteredVisits.length,
      scheduled: filteredVisits.filter(v => v.status === 'scheduled').length,
      in_progress: filteredVisits.filter(v => v.status === 'in_progress').length,
      completed: filteredVisits.filter(v => v.status === 'completed').length,
      cancelled: filteredVisits.filter(v => v.status === 'cancelled').length,
      missed: filteredVisits.filter(v => v.status === 'missed').length,
    };
    return stats;
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            {t('maintenanceCalendar', { fallback: 'Maintenance Calendar' })}
          </h1>
          <p className="text-sm text-gray-500">
            {t('manageScheduledVisits', { fallback: 'Manage and track your scheduled maintenance visits' })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showFilters || Object.values(filters).some(f => f)
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            {t('filters', { fallback: 'Filters' })}
            {Object.values(filters).some(f => f) && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {Object.values(filters).filter(f => f).length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            {t('scheduleVisit', { fallback: 'Schedule Visit' })}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{stats.scheduled}</div>
              <div className="text-sm text-gray-500">Scheduled</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <WrenchScrewdriverIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{stats.in_progress}</div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{stats.completed}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{stats.cancelled}</div>
              <div className="text-sm text-gray-500">Cancelled</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{stats.missed}</div>
              <div className="text-sm text-gray-500">Missed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {t('filterVisits', { fallback: 'Filter Visits' })}
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {t('clearAll', { fallback: 'Clear All' })}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('search', { fallback: 'Search' })}
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder={t('searchPlaceholder', { fallback: 'Search visits...' })}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('status', { fallback: 'Status' })}
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('allStatuses', { fallback: 'All Statuses' })}</option>
                <option value="scheduled">{t('scheduled', { fallback: 'Scheduled' })}</option>
                <option value="in_progress">{t('inProgress', { fallback: 'In Progress' })}</option>
                <option value="completed">{t('completed', { fallback: 'Completed' })}</option>
                <option value="cancelled">{t('cancelled', { fallback: 'Cancelled' })}</option>
                <option value="missed">{t('missed', { fallback: 'Missed' })}</option>
              </select>
            </div>
            
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('priority', { fallback: 'Priority' })}
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('allPriorities', { fallback: 'All Priorities' })}</option>
                <option value="low">{t('low', { fallback: 'Low' })}</option>
                <option value="medium">{t('medium', { fallback: 'Medium' })}</option>
                <option value="high">{t('high', { fallback: 'High' })}</option>
                <option value="urgent">{t('urgent', { fallback: 'Urgent' })}</option>
              </select>
            </div>
            
            {/* Technician */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('technician', { fallback: 'Technician' })}
              </label>
              <select
                value={filters.technician}
                onChange={(e) => handleFilterChange('technician', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('allTechnicians', { fallback: 'All Technicians' })}</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id.toString()}>
                    {tech.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <EnhancedCalendar
        events={convertVisitsToEvents()}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        view={currentView}
        onViewChange={setCurrentView}
        highlightedEventId={highlightedEventId}
        className="bg-white"
      />

      {/* Modals */}
      <MaintenanceScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={handleScheduleSuccess}
      />

      {selectedVisitId && (
        <MaintenanceDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedVisitId(null);
            setHighlightedEventId(null);
          }}
          visitId={selectedVisitId}
          onUpdate={fetchVisits}
        />
      )}
    </div>
  );
}