import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  MapPinIcon,
  PhoneIcon,
  ChevronRightIcon,
  WrenchScrewdriverIcon,
  PlayIcon,
  ArrowTopRightOnSquareIcon,
  WifiIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '@/lib/i18n/TranslationProvider';
import { technicianService, DashboardStats } from '@/services/technician';
import { toast } from 'sonner';
import { Button, Card, CardContent, CardHeader, Badge } from '@/components/ui';

export default function TechnicianDashboard() {
  const { t, isRTL } = useTranslation('technician');
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadDashboard();
    
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await technicianService.getDashboard();
      setStats(data);
      
      if (!isOnline) {
        toast.info(t('messages.offline_mode', { fallback: 'Working in offline mode with cached data' }));
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      if (!isOnline) {
        toast.warning(t('messages.offline_no_cache', { fallback: 'No cached data available. Connect to internet to load data.' }));
      } else {
        toast.error(t('messages.failed_to_load', { fallback: 'Failed to load dashboard' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartVisit = async (visitId: number) => {
    try {
      await technicianService.startVisit(visitId);
      
      if (isOnline) {
        toast.success(t('messages.visit_started', { fallback: 'Visit started successfully' }));
      } else {
        toast.success(t('messages.visit_queued', { fallback: 'Visit start queued for sync when online' }));
      }
      
      loadDashboard();
    } catch (error) {
      console.error('Failed to start visit:', error);
      toast.error(t('messages.failed_to_start_visit', { fallback: 'Failed to start visit' }));
    }
  };

  const handleCallClient = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleNavigateToClient = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
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
      urgent: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-yellow-600',
      low: 'text-gray-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with Offline Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.title', { fallback: 'Technician Dashboard' })}
          </h1>
          <p className="text-gray-500 mt-1">
            {t('dashboard.subtitle', { fallback: 'Manage your maintenance visits and tasks' })}
          </p>
        </div>
        
        {/* Offline/Online Indicator */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          isOnline 
            ? 'bg-green-100 text-green-800' 
            : 'bg-orange-100 text-orange-800'
        }`}>
          {isOnline ? (
            <WifiIcon className="w-4 h-4" />
          ) : (
            <SignalSlashIcon className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isOnline 
              ? t('status.online', { fallback: 'Online' })
              : t('status.offline', { fallback: 'Offline' })
            }
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.today_visits_count || 0}</p>
              <p className="text-sm text-gray-500">{t('dashboard.today_visits', { fallback: "Today's Visits" })}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats?.completed_today || 0}</p>
              <p className="text-sm text-gray-500">{t('dashboard.completed', { fallback: 'Completed' })}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats?.pending_today || 0}</p>
              <p className="text-sm text-gray-500">{t('dashboard.pending', { fallback: 'Pending' })}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ExclamationCircleIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats?.in_progress || 0}</p>
              <p className="text-sm text-gray-500">{t('dashboard.in_progress', { fallback: 'In Progress' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Visit Card */}
      {stats?.next_visit && (
        <div className="bg-gradient-to-r from-primary-50 to-indigo-50 rounded-xl border border-primary-200 p-6">
          <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <WrenchScrewdriverIcon className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-primary-900">
              {t('dashboard.next_visit', { fallback: 'Next Visit' })}
            </h2>
          </div>
          
          <div className={`flex items-start justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {stats.next_visit.customer?.name || 'N/A'}
                </h3>
                <p className="text-sm text-gray-600">{stats.next_visit.work_description}</p>
              </div>
              
              <div className={`flex flex-wrap gap-4 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 text-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <CalendarDaysIcon className="h-4 w-4" />
                  <span>{new Date(stats.next_visit.scheduled_date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</span>
                </div>
                <div className={`flex items-center gap-2 text-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <ClockIcon className="h-4 w-4" />
                  <span>{stats.next_visit.scheduled_time}</span>
                </div>
                {stats.next_visit.customer?.phone && (
                  <div className={`flex items-center gap-2 text-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <PhoneIcon className="h-4 w-4" />
                    <a href={`tel:${stats.next_visit.customer.phone}`} className="hover:text-primary-600">
                      {stats.next_visit.customer.phone}
                    </a>
                  </div>
                )}
                {stats.next_visit.customer?.address && (
                  <div className={`flex items-center gap-2 text-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <MapPinIcon className="h-4 w-4" />
                    <span className="truncate max-w-xs">{stats.next_visit.customer.address}</span>
                  </div>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => navigate(`/technician/visits/${stats.next_visit!.id}`)}
              className={`flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {t('dashboard.view_details', { fallback: 'View Details' })}
              <ChevronRightIcon className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Today's Visits */}
      <Card>
        <CardHeader>
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h2 className={`text-lg font-semibold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
              {t('dashboard.today_visits', { fallback: "Today's Visits" })}
            </h2>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate('/technician/visits')}
            >
              {t('dashboard.view_all', { fallback: 'View All' })}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {stats?.today_visits && stats.today_visits.length > 0 ? (
            <div className="space-y-4">
              {stats.today_visits.map((visit) => (
                <Card
                  key={visit.id}
                  className="border-l-4 border-l-primary-500 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/technician/visits/${visit.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {visit.customer?.name || 'N/A'}
                          </h3>
                          <Badge className={getPriorityColor(visit.priority)}>
                            {t(`visit_details.${visit.priority}`, { fallback: visit.priority })}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {visit.work_description || 'Maintenance visit'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {visit.scheduled_time}
                          </div>
                          {visit.customer?.address && (
                            <div className="flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">
                                {visit.customer.address}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Badge className={getStatusColor(visit.status)}>
                        {t(`status.${visit.status}`, { fallback: visit.status })}
                      </Badge>
                    </div>
                    
                    {/* Large Touch Target Action Buttons - Mobile Optimized */}
                    <div className="flex items-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                      {visit.status === 'scheduled' && (
                        <Button
                          size="lg"
                          onClick={() => handleStartVisit(visit.id)}
                          className="flex-1 min-h-[48px] text-base font-semibold" // Extra large touch target
                        >
                          <PlayIcon className="w-5 h-5 mr-2" />
                          {t('dashboard.start_visit', { fallback: 'Start Visit' })}
                        </Button>
                      )}
                      
                      {visit.status === 'in_progress' && (
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => navigate(`/technician/visits/${visit.id}/complete`)}
                          className="flex-1 min-h-[48px] text-base font-semibold" // Extra large touch target
                        >
                          <CheckCircleIcon className="w-5 h-5 mr-2" />
                          {t('dashboard.complete_visit', { fallback: 'Complete' })}
                        </Button>
                      )}
                      
                      {visit.customer?.phone && (
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => handleCallClient(visit.customer.phone!)}
                          className="min-h-[48px] min-w-[48px] p-3" // Extra large touch target
                          title={t('dashboard.call_customer', { fallback: 'Call Customer' })}
                        >
                          <PhoneIcon className="w-5 h-5" />
                        </Button>
                      )}
                      
                      {visit.customer?.address && (
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => handleNavigateToClient(visit.customer.address!)}
                          className="min-h-[48px] min-w-[48px] p-3" // Extra large touch target
                          title={t('dashboard.navigate_to_customer', { fallback: 'Navigate to Customer' })}
                        >
                          <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                {t('dashboard.no_visits_today', { fallback: 'No visits scheduled for today' })}
              </h3>
              <p className="text-gray-500 mt-1">
                {t('dashboard.no_visits_description', { fallback: 'Check back later or view all your visits' })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
