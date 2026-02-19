import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EyeIcon, UsersIcon, PrinterIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import api from '../../lib/api';
import { useTranslation } from '../../lib/i18n/TranslationProvider';
import { Pagination } from '@/components/ui/Pagination';
import { useBranch } from '../../contexts/BranchContext';
import { formatCurrency } from '@/lib/currency';

interface Staff {
  id: number;
  name: string;
  email: string;
  phone?: string;
  roles: Array<{ name: string }>;
  created_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function Staff() {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation('staff');
  const { currentBranch } = useBranch();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
  });
  
  // Selection states for bulk actions
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [isPrintingReport, setIsPrintingReport] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    fetchStaff();
  }, [search, currentBranch]);

  useEffect(() => {
    fetchStaff();
  }, [currentPage, itemsPerPage]);

  // Refresh staff list when navigating back to this page
  useEffect(() => {
    const handleFocus = () => {
      fetchStaff();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenant/staff', {
        params: { 
          search, 
          per_page: itemsPerPage,
          page: currentPage,
          branch_id: currentBranch?.id,
        }
      });
      const data = response.data;
      
      // Handle both paginated and non-paginated responses
      if (data.data && Array.isArray(data.data)) {
        setStaff(data.data);
        setPaginationMeta({
          current_page: data.current_page || 1,
          last_page: data.last_page || 1,
          per_page: data.per_page || itemsPerPage,
          total: data.total || data.data.length,
        });
      } else {
        setStaff(Array.isArray(data) ? data : []);
        setPaginationMeta({
          current_page: 1,
          last_page: 1,
          per_page: itemsPerPage,
          total: Array.isArray(data) ? data.length : 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      toast.error(t('notifications.loadError'));
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const handleCreateStaff = () => {
    navigate('/business/staff/create');
  };

  const handleEditStaff = (staffId: number) => {
    navigate(`/business/staff/edit/${staffId}`);
  };

  const handleViewStaff = (staffId: number) => {
    navigate(`/business/staff/view/${staffId}`);
  };

  const handleDeleteStaff = async (staffId: number) => {
    if (!confirm(t('modals.deleteMessage'))) {
      return;
    }

    try {
      await api.delete(`/tenant/staff/${staffId}`);
      toast.success(t('notifications.deleteSuccess'));
      fetchStaff();
    } catch (error) {
      console.error('Failed to delete staff member:', error);
      toast.error(t('notifications.deleteError'));
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'tenant_admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-primary-100 text-primary-800';
      case 'salesman':
        return 'bg-green-100 text-green-800';
      case 'technician':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRoleName = (roleName: string) => {
    return t(`roles.${roleName}`) || roleName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedStaffIds.length === staff.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(staff.map(s => s.id));
    }
  };

  const handleSelectStaff = (staffId: number) => {
    setSelectedStaffIds(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  // Print report for selected staff
  const handlePrintSelectedReport = async () => {
    if (selectedStaffIds.length === 0) {
      toast.error(t('selectStaffToPrint', { fallback: 'Please select staff members to print report' }));
      return;
    }

    try {
      setIsPrintingReport(true);
      const response = await api.post('/tenant/staff/report', {
        staff_ids: selectedStaffIds
      });
      
      const reports = response.data.reports || [];
      if (reports.length === 0) {
        toast.error(t('failedToGenerateReport', { fallback: 'Failed to generate report' }));
        return;
      }

      // Create print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error(t('popupBlocked', { fallback: 'Please allow popups to print' }));
        return;
      }

      const printContent = generateBulkPrintHTML(reports, response.data);
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
      setIsPrintingReport(false);
    }
  };

  // Print all staff report
  const handlePrintAllReport = async () => {
    const allIds = staff.map(s => s.id);
    if (allIds.length === 0) {
      toast.error(t('noStaffToPrint', { fallback: 'No staff members to print' }));
      return;
    }

    try {
      setIsPrintingReport(true);
      const response = await api.post('/tenant/staff/report', {
        staff_ids: allIds
      });
      
      const reports = response.data.reports || [];
      if (reports.length === 0) {
        toast.error(t('failedToGenerateReport', { fallback: 'Failed to generate report' }));
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error(t('popupBlocked', { fallback: 'Please allow popups to print' }));
        return;
      }

      const printContent = generateBulkPrintHTML(reports, response.data);
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
      setIsPrintingReport(false);
    }
  };

  const generateBulkPrintHTML = (reports: any[], meta: any) => {
    return `
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>${t('staffReport', { fallback: 'Staff Report' })}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; direction: ${isRTL ? 'rtl' : 'ltr'}; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #333; }
          .header p { margin: 5px 0; color: #666; }
          .staff-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
          .staff-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px; }
          .staff-name { font-size: 20px; font-weight: bold; color: #333; }
          .staff-role { display: inline-block; padding: 4px 12px; background: #e0e7ff; color: #4338ca; border-radius: 20px; font-size: 12px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
          .info-item label { font-weight: bold; color: #555; display: block; font-size: 12px; }
          .info-item span { color: #333; }
          .stats-row { display: flex; gap: 15px; margin-top: 15px; }
          .stat-box { flex: 1; text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
          .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px; }
          .summary-section { background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .summary-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
          .summary-stats { display: flex; gap: 20px; flex-wrap: wrap; }
          .summary-stat { text-align: center; }
          .summary-stat .value { font-size: 28px; font-weight: bold; color: #1e40af; }
          .summary-stat .label { font-size: 12px; color: #666; }
          @media print { 
            body { padding: 0; } 
            .staff-card { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t('staffReport', { fallback: 'Staff Report' })}</h1>
          <p>${meta.tenant?.name || ''}</p>
          <p>${t('generatedAt', { fallback: 'Generated at' })}: ${new Date(meta.generated_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</p>
          <p>${t('totalStaff', { fallback: 'Total Staff' })}: ${reports.length}</p>
        </div>

        <div class="summary-section">
          <div class="summary-title">${t('overallSummary', { fallback: 'Overall Summary' })}</div>
          <div class="summary-stats">
            <div class="summary-stat">
              <div class="value">${reports.reduce((sum, r) => sum + (r.performance?.total_sales || 0), 0)}</div>
              <div class="label">${t('totalSales', { fallback: 'Total Sales' })}</div>
            </div>
            <div class="summary-stat">
              <div class="value">${formatCurrency(reports.reduce((sum, r) => sum + (r.performance?.total_sales_amount || 0), 0))}</div>
              <div class="label">${t('totalRevenue', { fallback: 'Total Revenue' })}</div>
            </div>
            <div class="summary-stat">
              <div class="value">${reports.reduce((sum, r) => sum + (r.performance?.maintenance_visits || 0), 0)}</div>
              <div class="label">${t('maintenanceVisits', { fallback: 'Maintenance Visits' })}</div>
            </div>
          </div>
        </div>

        ${reports.map(report => `
          <div class="staff-card">
            <div class="staff-header">
              <div>
                <div class="staff-name">${report.staff.name}</div>
                <div style="color: #666; font-size: 14px;">${report.staff.email}</div>
              </div>
              <span class="staff-role">${report.staff.role}</span>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <label>${t('status', { fallback: 'Status' })}</label>
                <span>${report.staff.is_active ? t('active', { fallback: 'Active' }) : t('inactive', { fallback: 'Inactive' })}</span>
              </div>
              <div class="info-item">
                <label>${t('joinedAt', { fallback: 'Joined At' })}</label>
                <span>${new Date(report.staff.joined_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</span>
              </div>
              <div class="info-item">
                <label>${t('branches', { fallback: 'Branches' })}</label>
                <span>${report.staff.branches?.map((b: any) => b.name).join(', ') || t('allBranches', { fallback: 'All Branches' })}</span>
              </div>
            </div>

            <div class="stats-row">
              <div class="stat-box">
                <div class="stat-value">${report.performance.total_sales}</div>
                <div class="stat-label">${t('sales', { fallback: 'Sales' })}</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${formatCurrency(report.performance.total_sales_amount)}</div>
                <div class="stat-label">${t('revenue', { fallback: 'Revenue' })}</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${report.performance.maintenance_visits}</div>
                <div class="stat-label">${t('visits', { fallback: 'Visits' })}</div>
              </div>
            </div>
          </div>
        `).join('')}

        <div class="footer">
          <p>${t('reportFooter', { fallback: 'This report was automatically generated' })}</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      {/* Header */}
      <div className={`flex items-center ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('staffDescription')}
          </p>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Print Reports Dropdown */}
          <div className="relative group">
            <button 
              disabled={isPrintingReport}
              className={`inline-flex items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <PrinterIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {isPrintingReport ? t('generating', { fallback: 'Generating...' }) : t('printReport', { fallback: 'Print Report' })}
            </button>
            <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10`}>
              <button
                onClick={handlePrintSelectedReport}
                disabled={selectedStaffIds.length === 0 || isPrintingReport}
                className={`w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
              >
                <DocumentTextIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('printSelected', { fallback: 'Print Selected' })} ({selectedStaffIds.length})
              </button>
              <button
                onClick={handlePrintAllReport}
                disabled={staff.length === 0 || isPrintingReport}
                className={`w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center border-t border-gray-100 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
              >
                <UsersIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('printAll', { fallback: 'Print All' })} ({staff.length})
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleCreateStaff}
            className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transform hover:scale-[1.02] transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <PlusIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('buttons.add')}
          </button>
        </div>
      </div>


       {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl font-bold text-gray-900">{staff.length}</div>
          <div className="text-sm text-gray-500">{t('statistics.total')}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl font-bold text-purple-600">
            {staff.filter(s => s.roles?.[0]?.name === 'tenant_admin').length}
          </div>
          <div className="text-sm text-gray-500">{t('statistics.admins')}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl font-bold text-green-600">
            {staff.filter(s => s.roles?.[0]?.name === 'salesman').length}
          </div>
          <div className="text-sm text-gray-500">{t('statistics.salesmen')}</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <MagnifyingGlassIcon className={`h-5 w-5 absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-4' : 'left-4'}`} />
          <input
            type="text"
            placeholder={t('searchStaff')}
            className={`w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} py-3 text-sm`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <span className={`${isRTL ? 'mr-3' : 'ml-3'} text-gray-600`}>{t('loading')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedStaffIds.length === staff.length && staff.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('table.name')}
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('table.role')}
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('contact')}
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('table.joined')}
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {staff.map((member) => (
                  <tr key={member.id} className={`hover:bg-gray-50 transition-colors duration-200 ${selectedStaffIds.includes(member.id) ? 'bg-primary-50' : ''}`}>
                    <td className="px-4 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedStaffIds.includes(member.id)}
                        onChange={() => handleSelectStaff(member.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`h-12 w-12 flex-shrink-0 ${isRTL ? 'ml-4' : 'mr-4'}`}>
                          <img
                            className="h-12 w-12 rounded-full border-2 border-gray-100"
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&color=7F9CF5&background=EBF4FF`}
                            alt={member.name}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.roles && member.roles.length > 0 ? (
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.roles[0].name)}`}>
                          {formatRoleName(member.roles[0].name)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">{t('noRoleAssigned')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                      <button 
                        onClick={() => handleViewStaff(member.id)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                        title={t('buttons.view')}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditStaff(member.id)}
                        className="text-primary-600 hover:text-primary-900 p-2 rounded-lg hover:bg-primary-50 transition-colors duration-200"
                        title={t('buttons.edit')}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStaff(member.id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                        title={t('buttons.delete')}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {staff.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="text-gray-500">
                  <h3 className="text-lg font-medium">{t('noStaffFound')}</h3>
                  <p className="mt-1">{t('getStartedStaff')}</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Pagination */}
        {!loading && staff.length > 0 && (
          <Pagination
            currentPage={paginationMeta.current_page}
            totalPages={paginationMeta.last_page}
            totalItems={paginationMeta.total}
            itemsPerPage={paginationMeta.per_page}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(perPage) => {
              setItemsPerPage(perPage);
              setCurrentPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
}