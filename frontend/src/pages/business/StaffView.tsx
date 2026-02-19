import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  BuildingStorefrontIcon, 
  PrinterIcon, 
  ClockIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  LockClosedIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n/TranslationProvider';
import { formatCurrency } from '@/lib/currency';

interface Branch {
  id: number;
  name: string;
  code: string;
  is_default: boolean;
  is_active: boolean;
}

interface Activity {
  id: number;
  action: string;
  resource_type: string;
  resource_id: string | null;
  performed_at: string;
  request_data?: {
    description?: string;
    old_values?: Record<string, unknown>;
    new_values?: Record<string, unknown>;
  };
}

interface ActivitySummary {
  total_sales: number;
  total_sales_amount: number;
  maintenance_visits: number;
}

interface StaffMember {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  roles?: Array<{ name: string }>;
  branches?: Branch[];
}

export default function StaffView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation('staff');
  
  const [loading, setLoading] = useState(true);
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStaffMember();
      fetchActivities(1);
    }
  }, [id]);

  const fetchStaffMember = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tenant/staff/${id}`);
      const data = response.data.data || response.data;
      // Normalize role from roles array
      if (data.roles && data.roles.length > 0) {
        data.role = data.roles[0].name;
      }
      setStaffMember(data);
    } catch (error) {
      console.error('Failed to fetch staff member:', error);
      toast.error(t('failedToLoadStaff', { fallback: 'Failed to load staff member details' }));
      navigate('/business/staff');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async (page: number) => {
    if (!id) return;

    try {
      setLoadingActivities(true);
      const response = await api.get(`/tenant/staff/${id}/activities`, {
        params: { page, per_page: 10 }
      });
      setActivities(response.data.activities?.data || []);
      setActivitySummary(response.data.summary || null);
      setActivityTotalPages(response.data.activities?.last_page || 1);
      setActivityPage(page);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handlePrint = async () => {
    if (!id) return;

    try {
      setIsPrinting(true);
      const response = await api.post('/tenant/staff/report', {
        staff_ids: [parseInt(id)]
      });
      
      const reportData = response.data.reports?.[0];
      if (!reportData) {
        toast.error(t('failedToGenerateReport', { fallback: 'Failed to generate report' }));
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error(t('popupBlocked', { fallback: 'Please allow popups to print' }));
        return;
      }

      const printContent = generatePrintHTML(reportData, response.data);
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error(t('failedToGenerateReport', { fallback: 'Failed to generate report' }));
    } finally {
      setIsPrinting(false);
    }
  };

  const generatePrintHTML = (report: any, meta: any) => {
    const staff = report.staff;
    const performance = report.performance;
    const recentActivities = report.recent_activities || [];

    return `
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>${t('staffReport', { fallback: 'Staff Report' })} - ${staff.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; direction: ${isRTL ? 'rtl' : 'ltr'}; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #333; }
          .header p { margin: 5px 0; color: #666; }
          .section { margin-bottom: 25px; }
          .section h2 { color: #444; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { padding: 10px; background: #f9f9f9; border-radius: 5px; }
          .info-item label { font-weight: bold; color: #555; display: block; margin-bottom: 5px; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .stat-card { text-align: center; padding: 20px; background: #f0f7ff; border-radius: 8px; }
          .stat-card .value { font-size: 24px; font-weight: bold; color: #2563eb; }
          .stat-card .label { color: #666; margin-top: 5px; }
          .activity-list { list-style: none; padding: 0; }
          .activity-item { padding: 10px; border-bottom: 1px solid #eee; }
          .activity-item:last-child { border-bottom: none; }
          .activity-time { color: #888; font-size: 12px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t('staffReport', { fallback: 'Staff Report' })}</h1>
          <p>${meta.tenant?.name || ''}</p>
          <p>${t('generatedAt', { fallback: 'Generated at' })}: ${new Date(meta.generated_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</p>
        </div>

        <div class="section">
          <h2>${t('staffInformation', { fallback: 'Staff Information' })}</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>${t('name', { fallback: 'Name' })}</label>
              <span>${staff.name}</span>
            </div>
            <div class="info-item">
              <label>${t('email', { fallback: 'Email' })}</label>
              <span>${staff.email}</span>
            </div>
            <div class="info-item">
              <label>${t('role', { fallback: 'Role' })}</label>
              <span>${staff.role}</span>
            </div>
            <div class="info-item">
              <label>${t('status', { fallback: 'Status' })}</label>
              <span>${staff.is_active ? t('active', { fallback: 'Active' }) : t('inactive', { fallback: 'Inactive' })}</span>
            </div>
            <div class="info-item">
              <label>${t('joinedAt', { fallback: 'Joined At' })}</label>
              <span>${new Date(staff.joined_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</span>
            </div>
            <div class="info-item">
              <label>${t('branches', { fallback: 'Branches' })}</label>
              <span>${staff.branches?.map((b: any) => b.name).join(', ') || t('allBranches', { fallback: 'All Branches' })}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>${t('performanceSummary', { fallback: 'Performance Summary' })}</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="value">${performance.total_sales}</div>
              <div class="label">${t('totalSales', { fallback: 'Total Sales' })}</div>
            </div>
            <div class="stat-card">
              <div class="value">${formatCurrency(performance.total_sales_amount)}</div>
              <div class="label">${t('salesAmount', { fallback: 'Sales Amount' })}</div>
            </div>
            <div class="stat-card">
              <div class="value">${performance.maintenance_visits}</div>
              <div class="label">${t('maintenanceVisits', { fallback: 'Maintenance Visits' })}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>${t('recentActivities', { fallback: 'Recent Activities' })}</h2>
          <ul class="activity-list">
            ${recentActivities.length > 0 ? recentActivities.map((activity: any) => `
              <li class="activity-item">
                <strong>${formatActivityAction(activity.action)}</strong>
                ${activity.resource_type ? ` - ${activity.resource_type}` : ''}
                ${activity.resource_id ? ` #${activity.resource_id}` : ''}
                <div class="activity-time">${new Date(activity.performed_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</div>
              </li>
            `).join('') : `<li class="activity-item">${t('noActivities', { fallback: 'No recent activities' })}</li>`}
          </ul>
        </div>

        <div class="footer">
          <p>${t('reportFooter', { fallback: 'This report was automatically generated' })}</p>
        </div>
      </body>
      </html>
    `;
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'tenant_admin': t('tenantAdmin', { fallback: 'Tenant Admin' }),
      'manager': t('manager', { fallback: 'Manager' }),
      'salesman': t('salesman', { fallback: 'Salesman' }),
      'technician': t('technician', { fallback: 'Technician' }),
      'business_owner': t('businessOwner', { fallback: 'Business Owner' }),
    };
    return roleMap[role] || role;
  };

  const formatActivityAction = (action: string) => {
    return action.split('.').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('sale') || action.includes('pos')) {
      return <CurrencyDollarIcon className="h-5 w-5 text-green-600" />;
    }
    if (action.includes('maintenance') || action.includes('visit')) {
      return <WrenchScrewdriverIcon className="h-5 w-5 text-orange-600" />;
    }
    if (action.includes('branch')) {
      return <BuildingStorefrontIcon className="h-5 w-5 text-blue-600" />;
    }
    if (action.includes('product')) {
      return <CubeIcon className="h-5 w-5 text-purple-600" />;
    }
    if (action.includes('login') || action.includes('auth')) {
      return <LockClosedIcon className="h-5 w-5 text-gray-600" />;
    }
    return <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'tenant_admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'salesman': return 'bg-green-100 text-green-800';
      case 'technician': return 'bg-orange-100 text-orange-800';
      case 'business_owner': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!staffMember) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('staffNotFound', { fallback: 'Staff member not found' })}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/business/staff')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isRTL ? <ChevronRightIcon className="h-5 w-5" /> : <ArrowLeftIcon className="h-5 w-5" />}
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{staffMember.name}</h1>
            <p className="text-gray-500">{staffMember.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <PrinterIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isPrinting ? t('generating', { fallback: 'Generating...' }) : t('printReport', { fallback: 'Print Report' })}
          </button>
          <button
            onClick={() => navigate(`/business/staff/edit/${id}`)}
            className={`inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <PencilIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('buttons.edit', { fallback: 'Edit' })}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Staff Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(staffMember.name)}&size=96&color=7F9CF5&background=EBF4FF`}
                  alt={staffMember.name}
                  className="w-full h-full rounded-full border-4 border-gray-100"
                />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{staffMember.name}</h2>
              <span className={`inline-flex px-3 py-1 mt-2 text-sm font-medium rounded-full ${getRoleColor(staffMember.role)}`}>
                {getRoleDisplayName(staffMember.role)}
              </span>
            </div>

            <div className="space-y-4">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">{staffMember.email}</span>
              </div>
              {staffMember.phone && (
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">{staffMember.phone}</span>
                </div>
              )}
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">
                  {t('memberSince', { fallback: 'Member since' })} {formatDate(staffMember.created_at)}
                </span>
              </div>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <UserCircleIcon className="h-5 w-5 text-gray-400" />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${staffMember.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {staffMember.is_active ? t('active', { fallback: 'Active' }) : t('inactive', { fallback: 'Inactive' })}
                </span>
              </div>
            </div>
          </div>

          {/* Branch Assignment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <BuildingStorefrontIcon className="h-5 w-5 text-gray-500" />
              {t('branchAssignment', { fallback: 'Branch Assignment' })}
            </h3>
            {staffMember.branches && staffMember.branches.length > 0 ? (
              <div className="space-y-3">
                {staffMember.branches.map((branch) => (
                  <div
                    key={branch.id}
                    className={`flex items-center p-3 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <BuildingStorefrontIcon className={`h-5 w-5 text-blue-500 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                      <p className="text-xs text-gray-500">{branch.code}</p>
                    </div>
                    {branch.is_default && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        {t('default', { fallback: 'Default' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <BuildingStorefrontIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">{t('accessAllBranches', { fallback: 'Access to all branches' })}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Performance & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Summary */}
          {activitySummary && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('performanceSummary', { fallback: 'Performance Summary' })}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">{activitySummary.total_sales}</div>
                  <div className="text-sm text-gray-600 mt-1">{t('totalSales', { fallback: 'Total Sales' })}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">{formatCurrency(activitySummary.total_sales_amount)}</div>
                  <div className="text-sm text-gray-600 mt-1">{t('salesAmount', { fallback: 'Sales Amount' })}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-600">{activitySummary.maintenance_visits}</div>
                  <div className="text-sm text-gray-600 mt-1">{t('maintenanceVisits', { fallback: 'Maintenance Visits' })}</div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <ClockIcon className="h-5 w-5 text-gray-500" />
              {t('activityTimeline', { fallback: 'Activity Timeline' })}
            </h3>
            
            {loadingActivities ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : activities.length > 0 ? (
              <>
                <div className="relative">
                  {/* Timeline line */}
                  <div className={`absolute top-0 bottom-0 w-0.5 bg-gray-200 ${isRTL ? 'right-5' : 'left-5'}`}></div>
                  
                  <div className="space-y-4">
                    {activities.map((activity, index) => (
                      <div key={activity.id || index} className={`relative flex items-start ${isRTL ? 'pr-12' : 'pl-12'}`}>
                        {/* Timeline dot */}
                        <div className={`absolute w-10 h-10 bg-white border-2 border-primary-500 rounded-full flex items-center justify-center text-lg ${isRTL ? 'right-0' : 'left-0'}`}>
                          {getActivityIcon(activity.action)}
                        </div>
                        
                        <div className="flex-1 bg-gray-50 p-4 rounded-lg">
                          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="font-medium text-gray-900">
                              {formatActivityAction(activity.action)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(activity.performed_at)}
                            </span>
                          </div>
                          {activity.resource_type && (
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.resource_type}
                              {activity.resource_id && ` #${activity.resource_id}`}
                            </p>
                          )}
                          {activity.request_data?.description && (
                            <p className="text-sm text-gray-500 mt-1">{activity.request_data.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pagination */}
                {activityTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => fetchActivities(activityPage - 1)}
                      disabled={activityPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRTL ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
                    </button>
                    <span className="text-sm text-gray-600">
                      {t('pageOf', { fallback: 'Page {{current}} of {{total}}' })
                        .replace('{{current}}', String(activityPage))
                        .replace('{{total}}', String(activityTotalPages))}
                    </span>
                    <button
                      onClick={() => fetchActivities(activityPage + 1)}
                      disabled={activityPage === activityTotalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRTL ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <ClockIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">{t('noActivitiesYet', { fallback: 'No activities recorded yet' })}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {t('activitiesWillAppear', { fallback: 'Activities will appear here as the staff member uses the system' })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
