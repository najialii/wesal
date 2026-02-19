import { useState, useEffect, useRef } from 'react'
import { BaseModal } from '@/components/ui/base-modal'
import { toast } from 'sonner'
import api from '@/lib/api'
import { BuildingStorefrontIcon, PrinterIcon, ClockIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useTranslation, useDirectionClasses } from '@/lib/translation'
import { formatCurrency } from '@/lib/currency'

interface Branch {
  id: number
  name: string
  code: string
  is_default: boolean
  is_active: boolean
}

interface Activity {
  id: number
  action: string
  resource_type: string
  resource_id: string | null
  performed_at: string
  request_data?: {
    description?: string
    old_values?: Record<string, unknown>
    new_values?: Record<string, unknown>
  }
}

interface ActivitySummary {
  total_sales: number
  total_sales_amount: number
  maintenance_visits: number
}

interface StaffMember {
  id: number
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login_at?: string
  permissions?: string[]
  branches?: Branch[]
}

interface StaffDetailModalProps {
  isOpen: boolean
  onClose: () => void
  staffId: number | null
}

export function StaffDetailModal({
  isOpen,
  onClose,
  staffId,
}: StaffDetailModalProps) {
  const { t } = useTranslation('staff')
  const { isRTL } = useDirectionClasses()
  const [loading, setLoading] = useState(false)
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null)
  const [activityPage, setActivityPage] = useState(1)
  const [activityTotalPages, setActivityTotalPages] = useState(1)
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && staffId) {
      fetchStaffMember()
      fetchActivities(1)
    }
  }, [isOpen, staffId])

  const fetchStaffMember = async () => {
    if (!staffId) return

    try {
      setLoading(true)
      const response = await api.get(`/tenant/staff/${staffId}`)
      setStaffMember(response.data.data || response.data)
    } catch (error) {
      console.error('Failed to fetch staff member:', error)
      toast.error(t('failedToLoadStaff', { fallback: 'Failed to load staff member details' }))
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async (page: number) => {
    if (!staffId) return

    try {
      setLoadingActivities(true)
      const response = await api.get(`/tenant/staff/${staffId}/activities`, {
        params: { page, per_page: 5 }
      })
      setActivities(response.data.activities?.data || [])
      setActivitySummary(response.data.summary || null)
      setActivityTotalPages(response.data.activities?.last_page || 1)
      setActivityPage(page)
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoadingActivities(false)
    }
  }

  const handlePrint = async () => {
    if (!staffId) return

    try {
      setIsPrinting(true)
      const response = await api.post('/tenant/staff/report', {
        staff_ids: [staffId]
      })
      
      const reportData = response.data.reports?.[0]
      if (!reportData) {
        toast.error(t('failedToGenerateReport', { fallback: 'Failed to generate report' }))
        return
      }

      // Create print window
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error(t('popupBlocked', { fallback: 'Please allow popups to print' }))
        return
      }

      const printContent = generatePrintHTML(reportData, response.data)
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    } catch (error) {
      console.error('Failed to generate report:', error)
      toast.error(t('failedToGenerateReport', { fallback: 'Failed to generate report' }))
    } finally {
      setIsPrinting(false)
    }
  }

  const generatePrintHTML = (report: any, meta: any) => {
    const staff = report.staff
    const performance = report.performance
    const recentActivities = report.recent_activities || []

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
    `
  }

  const handleClose = () => {
    setStaffMember(null)
    setActivities([])
    setActivitySummary(null)
    setActivityPage(1)
    onClose()
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'tenant_admin': t('tenantAdmin', { fallback: 'Tenant Admin' }),
      'manager': t('manager', { fallback: 'Manager' }),
      'salesman': t('salesman', { fallback: 'Salesman' }),
      'technician': t('technician', { fallback: 'Technician' }),
      'business_owner': t('businessOwner', { fallback: 'Business Owner' }),
    }
    return roleMap[role] || role
  }

  const formatActivityAction = (action: string) => {
    return action.split('.').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getActivityIcon = (action: string) => {
    if (action.includes('sale') || action.includes('pos')) {
      return '💰'
    } else if (action.includes('maintenance') || action.includes('visit')) {
      return '🔧'
    } else if (action.includes('branch')) {
      return '🏪'
    } else if (action.includes('product')) {
      return '📦'
    } else if (action.includes('login') || action.includes('auth')) {
      return '🔐'
    }
    return '📋'
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('staffDetails', { fallback: 'Staff Member Details' })}
      size="xl"
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className={`text-gray-600 ${isRTL ? 'mr-3' : 'ml-3'}`}>
            {t('loadingStaffDetails', { fallback: 'Loading staff member details...' })}
          </span>
        </div>
      ) : staffMember ? (
        <div className="space-y-6" ref={printRef}>
          {/* Header with Status and Print Button */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{staffMember.name}</h2>
              <p className="text-gray-600">{staffMember.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <PrinterIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isPrinting ? t('generating', { fallback: 'Generating...' }) : t('printReport', { fallback: 'Print Report' })}
              </button>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  staffMember.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {staffMember.is_active ? t('active', { fallback: 'Active' }) : t('inactive', { fallback: 'Inactive' })}
              </span>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('basicInformation', { fallback: 'Basic Information' })}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">{t('fullName', { fallback: 'Full Name' })}</label>
                <p className="mt-1 text-sm text-gray-900">{staffMember.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">{t('emailAddress', { fallback: 'Email Address' })}</label>
                <p className="mt-1 text-sm text-gray-900">{staffMember.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">{t('role', { fallback: 'Role' })}</label>
                <p className="mt-1 text-sm text-gray-900">{getRoleDisplayName(staffMember.role)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">{t('memberSince', { fallback: 'Member Since' })}</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(staffMember.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          {activitySummary && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('performanceSummary', { fallback: 'Performance Summary' })}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{activitySummary.total_sales}</div>
                  <div className="text-sm text-gray-500">{t('totalSales', { fallback: 'Total Sales' })}</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(activitySummary.total_sales_amount)}</div>
                  <div className="text-sm text-gray-500">{t('salesAmount', { fallback: 'Sales Amount' })}</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{activitySummary.maintenance_visits}</div>
                  <div className="text-sm text-gray-500">{t('maintenanceVisits', { fallback: 'Maintenance Visits' })}</div>
                </div>
              </div>
            </div>
          )}

          {/* Branch Assignment */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BuildingStorefrontIcon className={`h-5 w-5 text-gray-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('branchAssignment', { fallback: 'Branch Assignment' })}
            </h3>
            {staffMember.branches && staffMember.branches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {staffMember.branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex items-center p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <BuildingStorefrontIcon className={`h-5 w-5 text-blue-500 flex-shrink-0 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{branch.name}</p>
                      <p className="text-xs text-gray-500">
                        {branch.code}
                        {branch.is_default && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                            {t('default', { fallback: 'Default' })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <BuildingStorefrontIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">{t('accessAllBranches', { fallback: 'This staff member has access to all branches' })}</p>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ClockIcon className={`h-5 w-5 text-gray-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('activityTimeline', { fallback: 'Activity Timeline' })}
            </h3>
            
            {loadingActivities ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : activities.length > 0 ? (
              <>
                <div className="relative">
                  {/* Timeline line */}
                  <div className={`absolute top-0 bottom-0 w-0.5 bg-gray-200 ${isRTL ? 'right-4' : 'left-4'}`}></div>
                  
                  <div className="space-y-4">
                    {activities.map((activity, index) => (
                      <div key={activity.id || index} className={`relative flex items-start ${isRTL ? 'pr-10' : 'pl-10'}`}>
                        {/* Timeline dot */}
                        <div className={`absolute w-8 h-8 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center text-sm ${isRTL ? 'right-0' : 'left-0'}`}>
                          {getActivityIcon(activity.action)}
                        </div>
                        
                        <div className="flex-1 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              {formatActivityAction(activity.action)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(activity.performed_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
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
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => fetchActivities(activityPage - 1)}
                      disabled={activityPage === 1}
                      className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRTL ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">{t('noActivitiesYet', { fallback: 'No activities recorded yet' })}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('close', { fallback: 'Close' })}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">{t('staffNotFound', { fallback: 'Staff member not found' })}</p>
        </div>
      )}
    </BaseModal>
  )
}
