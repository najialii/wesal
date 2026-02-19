import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import moment from 'moment';
import { MaintenanceScheduleModal } from '@/components/modals/MaintenanceScheduleModal';
import { Calendar } from '@/components/ui/Calendar';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import BranchSelector from '@/components/BranchSelector';

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
  next_visit_date?: string;
  contract: {
    id: number;
    customer_name: string;
    customer_phone?: string;
    customer_address?: string;
    product: {
      id: number;
      name: string;
    };
    sale: {
      id: number;
      sale_number: string;
    };
  };
  assigned_worker?: {
    id: number;
    name: string;
    job_title: string;
  };
  items?: MaintenanceVisitItem[];
  branch?: {
    id: number;
    name: string;
    code: string;
  };
}

interface MaintenanceVisitItem {
  id: number;
  quantity_used: number;
  unit_cost: number;
  total_cost: number;
  notes?: string;
  maintenance_product: {
    id: number;
    name: string;
    sku: string;
    unit: string;
  };
}



export default function Maintenance() {
  const navigate = useNavigate();
  const { t } = useTranslation('maintenance');
  const { isRTL } = useDirectionClasses();
  const [visits, setVisits] = useState<MaintenanceVisit[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [highlightedVisitId, setHighlightedVisitId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBranch, setCurrentBranch] = useState<any>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCurrentBranch();
    fetchMaintenanceVisits();
  }, []);

  useEffect(() => {
    if (view === 'calendar') {
      fetchCalendarEvents();
    }
  }, [view, currentMonth]);

  const fetchCurrentBranch = async () => {
    try {
      const response = await api.get('/business/branches/current');
      setCurrentBranch(response.data);
    } catch (error) {
      console.error('Failed to fetch current branch:', error);
    }
  };

  const fetchMaintenanceVisits = async () => {
    try {
      setLoading(true);
      console.log('Fetching maintenance visits...');
      const response = await api.get('/maintenance/visits');
      console.log('Maintenance visits response:', response.data);
      
      // Handle paginated response structure
      const visitsData = response.data.visits?.data || response.data.data || response.data.visits || [];
      console.log('Parsed visits data:', visitsData);
      console.log('Is array?', Array.isArray(visitsData));
      
      setVisits(Array.isArray(visitsData) ? visitsData : []);
      console.log('Visits set to state:', Array.isArray(visitsData) ? visitsData.length : 0, 'items');
    } catch (error: any) {
      console.error('Failed to fetch maintenance visits:', error);
      console.error('Error response:', error.response?.data);
      toast.error(t('failedToLoadVisits', { fallback: 'Failed to load maintenance visits' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const start = moment(currentMonth).startOf('month').format('YYYY-MM-DD');
      const end = moment(currentMonth).endOf('month').format('YYYY-MM-DD');
      
      console.log('Fetching calendar events for:', start, 'to', end);
      const response = await api.get('/maintenance/calendar', {
        params: { start, end }
      });
      
      console.log('Calendar events response:', response.data);
      const events = response.data.events || [];
      
      // Transform events to calendar format
      const transformedEvents = events.map((event: any) => ({
        id: event.id, // Backend returns number for visits, string for recurring
        date: new Date(event.date),
        title: event.title,
        color: getEventColor(event.status),
        priority: event.priority,
        status: event.status,
        type: event.type,
        contractId: event.contract_id,
      }));
      
      setCalendarEvents(transformedEvents);
      console.log('Transformed calendar events:', transformedEvents.length);
    } catch (error: any) {
      console.error('Failed to fetch calendar events:', error);
      toast.error(t('failedToLoadCalendarEvents', { fallback: 'Failed to load calendar events' }));
    }
  };

  const handleScheduleSuccess = () => {
    fetchMaintenanceVisits();
    toast.success(t('visitScheduledSuccess', { fallback: 'Maintenance visit scheduled successfully' }));
  };

  const handleViewVisit = (visitId: number) => {
    navigate(`/business/maintenance/view/${visitId}`);
  };

  const handleJumpToCalendar = (visit: MaintenanceVisit) => {
    // Switch to calendar view
    setView('calendar');
    // Highlight the visit
    setHighlightedVisitId(visit.id);
    // Clear highlight after 3 seconds
    setTimeout(() => setHighlightedVisitId(null), 3000);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCalendarEventClick = (eventId: number | string) => {
    console.log('Event clicked:', eventId, 'Type:', typeof eventId);
    
    // Calendar only shows scheduled visits - navigate to visit details
    if (typeof eventId === 'number') {
      handleViewVisit(eventId);
    } else {
      // Fallback for any unexpected case
      console.warn('Unknown event ID format:', eventId);
    }
  };

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
  };

  // Filter and paginate visits
  const filteredVisits = visits.filter(visit => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      visit.contract?.customer_name?.toLowerCase().includes(searchLower) ||
      visit.contract?.product?.name?.toLowerCase().includes(searchLower) ||
      visit.assigned_worker?.name?.toLowerCase().includes(searchLower) ||
      visit.status?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);
  const paginatedVisits = filteredVisits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'missed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {t('maintenanceSchedule', { fallback: 'Maintenance Schedule' })}
            </h1>
            <p className="text-sm text-gray-500">{t('maintenanceDescription', { fallback: 'Manage maintenance visits and schedules' })}</p>
          </div>
          <div className="flex items-center gap-3">
            {currentBranch && (
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                <BuildingStorefrontIcon className="h-5 w-5 text-blue-600" />
                <span className="text-blue-700 font-medium">{currentBranch.name}</span>
              </div>
            )}
            <BranchSelector onBranchChange={() => {
              fetchCurrentBranch();
              fetchMaintenanceVisits();
              if (view === 'calendar') {
                fetchCalendarEvents();
              }
            }} />
            <button 
              onClick={() => setIsScheduleModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              {t('scheduleVisit', { fallback: 'Schedule Visit' })}
            </button>
          </div>
        </div>
        
        {/* View Toggle as Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('calendar')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === 'calendar'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            {t('calendar', { fallback: 'Calendar' })}
          </button>
          <button
            onClick={() => setView('list')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === 'list'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {t('listView', { fallback: 'List View' })}
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <Calendar
            mode="single"
            events={calendarEvents}
            onEventClick={handleCalendarEventClick}
            highlightedEventId={highlightedVisitId}
            onMonthChange={handleMonthChange}
            className="w-full"
          />
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">{t('maintenanceVisits', { fallback: 'Maintenance Visits' })}</h2>
              <div className="relative">
                <MagnifyingGlassIcon className={`h-4 w-4 absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={t('searchVisits', { fallback: 'Search visits...' })}
                  className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>
          </div>

          {filteredVisits.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <WrenchScrewdriverIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                {searchQuery 
                  ? t('noVisitsFound', { fallback: 'No visits found matching your search' })
                  : t('noVisitsScheduled', { fallback: 'No maintenance visits scheduled' })
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('customer', { fallback: 'Customer' })}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('product', { fallback: 'Product' })}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('scheduledDate', { fallback: 'Scheduled Date' })}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('worker', { fallback: 'Worker' })}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('status', { fallback: 'Status' })}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('priority', { fallback: 'Priority' })}
                      </th>
                      <th className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('actions', { fallback: 'Actions' })}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedVisits.map((visit) => {
                      // Skip visits without contract data
                      if (!visit.contract || !visit.contract.product) {
                        console.warn('Visit missing contract data:', visit);
                        return null;
                      }
                      
                      return (
                        <tr key={visit.id} className="windows10-tile hover:bg-gray-50 transition-all duration-200 hover:shadow-sm">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {visit.contract.customer_name}
                            </div>
                            {visit.contract.customer_phone && (
                              <div className="text-xs text-gray-500">
                                {visit.contract.customer_phone}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {visit.contract.product.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm text-gray-900">
                              <CalendarIcon className="h-4 w-4 text-gray-400" />
                              <span>{moment(visit.scheduled_date).format('MMM DD, YYYY')}</span>
                            </div>
                            {visit.scheduled_time && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <ClockIcon className="h-3 w-3" />
                                <span>{visit.scheduled_time}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {visit.assigned_worker?.name || '-'}
                            </div>
                            {visit.assigned_worker?.job_title && (
                              <div className="text-xs text-gray-500">
                                {visit.assigned_worker.job_title}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(visit.status)}`}>
                              {t(visit.status, { fallback: visit.status.replace('_', ' ') })}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-xs font-medium ${getPriorityColor(visit.priority)}`}>
                              {t(visit.priority, { fallback: visit.priority })}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-end">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleJumpToCalendar(visit)}
                                className="windows10-tile p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
                                title={t('viewOnCalendar', { fallback: 'View on Calendar' })}
                              >
                                <CalendarIcon className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleViewVisit(visit.id)}
                                className="windows10-tile p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
                                title={t('viewDetails', { fallback: 'View Details' })}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {t('showing', { fallback: 'Showing' })} {((currentPage - 1) * itemsPerPage) + 1} {t('to', { fallback: 'to' })} {Math.min(currentPage * itemsPerPage, filteredVisits.length)} {t('of', { fallback: 'of' })} {filteredVisits.length} {t('results', { fallback: 'results' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {t('previous', { fallback: 'Previous' })}
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {t('next', { fallback: 'Next' })}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modals */}
      <MaintenanceScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={handleScheduleSuccess}
      />
    </div>
  );
}