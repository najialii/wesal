import { useState, useEffect } from 'react';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import { 
  ClockIcon, 
  UserIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import api from '../../lib/api';

interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function AuditLogs() {
  const { t } = useTranslation('common');
  const { isRTL } = useDirectionClasses();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [search, filterAction, filterUser, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/business/audit-logs', {
        params: {
          search,
          action: filterAction,
          user_id: filterUser,
          page,
          per_page: 50,
        },
      });
      setLogs(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-100 text-green-700';
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-100 text-blue-700';
    if (action.includes('delete') || action.includes('deactivate')) return 'bg-red-100 text-red-700';
    if (action.includes('login')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">
          {isRTL ? 'سجل التدقيق' : 'Audit Logs'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isRTL ? 'عرض جميع إجراءات المستخدمين والتغييرات في النظام' : 'View all user actions and system changes'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className={`h-5 w-5 absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-4' : 'left-4'}`} />
            <input
              type="text"
              placeholder={isRTL ? 'بحث في السجلات...' : 'Search logs...'}
              className={`w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} py-3 text-sm`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Action Filter */}
          <div className="relative">
            <FunnelIcon className={`h-5 w-5 absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-4' : 'left-4'}`} />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className={`w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} py-3 text-sm`}
            >
              <option value="">{isRTL ? 'جميع الإجراءات' : 'All Actions'}</option>
              <option value="create">{isRTL ? 'إنشاء' : 'Create'}</option>
              <option value="update">{isRTL ? 'تحديث' : 'Update'}</option>
              <option value="delete">{isRTL ? 'حذف' : 'Delete'}</option>
              <option value="login">{isRTL ? 'تسجيل دخول' : 'Login'}</option>
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearch('');
              setFilterAction('');
              setFilterUser('');
              setPage(1);
            }}
            className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {isRTL ? 'مسح الفلاتر' : 'Clear Filters'}
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isRTL ? 'لا توجد سجلات' : 'No Logs Found'}
            </h3>
            <p className="text-sm text-gray-500">
              {isRTL ? 'لم يتم العثور على سجلات تدقيق' : 'No audit logs found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'التاريخ والوقت' : 'Date & Time'}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'المستخدم' : 'User'}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'الإجراء' : 'Action'}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'الوصف' : 'Description'}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {isRTL ? 'عنوان IP' : 'IP Address'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{formatDate(log.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                          <div className="text-xs text-gray-500">{log.user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {log.description}
                      </div>
                      {log.entity_type && (
                        <div className="text-xs text-gray-500 mt-1">
                          {log.entity_type} {log.entity_id && `#${log.entity_id}`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRTL ? 'السابق' : 'Previous'}
              </button>
              <span className="text-sm text-gray-700">
                {isRTL ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRTL ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
