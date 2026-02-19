import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useLocalization';
import { 
  Filter, 
  Download, 
  Eye, 
  Activity,
  Shield,
  RefreshCw
} from 'lucide-react';

interface AuditLog {
  id: number;
  performed_at: string;
  user_email: string;
  user_name: string;
  is_super_admin: boolean;
  action: string;
  resource_type: string;
  resource_id: string;
  method: string;
  url: string;
  ip_address: string;
  response_status: number;
  execution_time: number;
  risk_level: 'low' | 'medium' | 'high';
  user?: {
    id: number;
    name: string;
    email: string;
  };
  tenant?: {
    id: number;
    name: string;
    slug: string;
  };
}

interface AuditLogFilters {
  search: string;
  user_id: string;
  action: string;
  resource_type: string;
  tenant_id: string;
  risk_level: string;
  start_date: string;
  end_date: string;
  status_code: string;
  method: string;
  errors_only: boolean;
  critical_only: boolean;
  slow_requests: boolean;
}

interface FilterOptions {
  actions: string[];
  resource_types: string[];
  status_codes: number[];
  methods: string[];
  risk_levels: string[];
}

interface AuditLogAnalytics {
  statistics: {
    total_actions: number;
    unique_users: number;
    unique_sessions: number;
    unique_ips: number;
    error_rate: number;
    avg_execution_time: number;
  };
  actions: Array<{ action: string; count: number }>;
  status_codes: Array<{ response_status: number; count: number }>;
  risk_levels: { low: number; medium: number; high: number };
  top_users: Array<{ user_email: string; user_name: string; action_count: number }>;
  timeline: Array<{ date: string; total_actions: number; errors: number; avg_execution_time: number }>;
  resources: Array<{ resource_type: string; count: number }>;
}

const AuditLogs: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<AuditLogAnalytics | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [filters, setFilters] = useState<AuditLogFilters>({
    search: '',
    user_id: '',
    action: '',
    resource_type: '',
    tenant_id: '',
    risk_level: '',
    start_date: '',
    end_date: '',
    status_code: '',
    method: '',
    errors_only: false,
    critical_only: false,
    slow_requests: false,
  });

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '25',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => 
            value !== '' && value !== false
          )
        )
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch audit logs');

      const data = await response.json();
      setLogs(data.data);
      setCurrentPage(data.meta.current_page);
      setTotalPages(data.meta.last_page);
      setTotalItems(data.meta.total);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await fetch(`/api/admin/audit-logs/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.start_date, filters.end_date]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/audit-logs/filter-options', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch filter options');

      const data = await response.json();
      setFilterOptions(data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchFilterOptions();
  }, [fetchLogs, fetchFilterOptions]);

  useEffect(() => {
    if (showAnalytics) {
      fetchAnalytics();
    }
  }, [showAnalytics, fetchAnalytics]);

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({
        format,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => 
            value !== '' && value !== false
          )
        )
      });

      const response = await fetch(`/api/admin/audit-logs/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to export logs');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 500) return 'text-red-600 bg-red-50';
    if (status >= 400) return 'text-yellow-600 bg-yellow-50';
    if (status >= 300) return 'text-blue-600 bg-blue-50';
    return 'text-green-600 bg-green-50';
  };

  const formatExecutionTime = (time: number) => {
    if (!time) return 'N/A';
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('admin.auditLogs.title', 'Audit Logs')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('admin.auditLogs.subtitle', 'Monitor and review all administrative actions')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            {t('admin.auditLogs.analytics', 'Analytics')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {t('admin.auditLogs.filters', 'Filters')}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('admin.auditLogs.export', 'Export')}
          </Button>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && analytics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t('admin.auditLogs.analyticsTitle', 'Audit Log Analytics')}
          </h3>
          
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.statistics.total_actions.toLocaleString()}
              </div>
              <div className="text-sm text-blue-600">Total Actions</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analytics.statistics.unique_users}
              </div>
              <div className="text-sm text-green-600">Unique Users</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.statistics.unique_sessions}
              </div>
              <div className="text-sm text-purple-600">Sessions</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {analytics.statistics.error_rate}%
              </div>
              <div className="text-sm text-orange-600">Error Rate</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatExecutionTime(analytics.statistics.avg_execution_time)}
              </div>
              <div className="text-sm text-blue-600">Avg Time</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {analytics.statistics.unique_ips}
              </div>
              <div className="text-sm text-gray-600">Unique IPs</div>
            </div>
          </div>

          {/* Risk Level Distribution */}
          <div className="mb-6">
            <h4 className="font-medium mb-2">Risk Level Distribution</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Low: {analytics.risk_levels.low}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm">Medium: {analytics.risk_levels.medium}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm">High: {analytics.risk_levels.high}%</span>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Top Actions</h4>
              <div className="space-y-2">
                {analytics.actions.slice(0, 5).map((action, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="capitalize">{action.action.replace('_', ' ')}</span>
                    <span className="font-medium">{action.count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Top Users</h4>
              <div className="space-y-2">
                {analytics.top_users.slice(0, 5).map((user, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{user.user_name || user.user_email}</span>
                    <span className="font-medium">{user.action_count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t('admin.auditLogs.filtersTitle', 'Filter Options')}
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <Input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                {filterOptions?.actions.map(action => (
                  <option key={action} value={action}>
                    {action.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Resource Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Resource Type</label>
              <select
                value={filters.resource_type}
                onChange={(e) => handleFilterChange('resource_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Resources</option>
                {filterOptions?.resource_types.map(type => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Level Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Risk Level</label>
              <select
                value={filters.risk_level}
                onChange={(e) => handleFilterChange('risk_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Quick Filters */}
            <div className="col-span-full">
              <label className="block text-sm font-medium mb-2">Quick Filters</label>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.errors_only}
                    onChange={(e) => handleFilterChange('errors_only', e.target.checked)}
                  />
                  <span className="text-sm">Errors Only</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.critical_only}
                    onChange={(e) => handleFilterChange('critical_only', e.target.checked)}
                  />
                  <span className="text-sm">Critical Actions</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.slow_requests}
                    onChange={(e) => handleFilterChange('slow_requests', e.target.checked)}
                  />
                  <span className="text-sm">Slow Requests</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  search: '',
                  user_id: '',
                  action: '',
                  resource_type: '',
                  tenant_id: '',
                  risk_level: '',
                  start_date: '',
                  end_date: '',
                  status_code: '',
                  method: '',
                  errors_only: false,
                  critical_only: false,
                  slow_requests: false,
                });
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
            <Button onClick={() => fetchLogs(1)}>
              Apply Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Audit Logs Table */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {t('admin.auditLogs.logsTitle', 'Audit Log Entries')}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Showing {logs.length} of {totalItems.toLocaleString()} entries</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(currentPage)}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Time</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Resource</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Risk</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Time</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">IP</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {new Date(log.performed_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.performed_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {log.is_super_admin && (
                              <Shield className="w-4 h-4 text-red-500" />
                            )}
                            <div>
                              <div className="text-sm font-medium">
                                {log.user_name || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {log.user_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium capitalize">
                            {log.action.replace('_', ' ')}
                          </span>
                          <div className="text-xs text-gray-500">
                            {log.method}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {log.resource_type && (
                              <span className="capitalize">{log.resource_type}</span>
                            )}
                            {log.resource_id && (
                              <span className="text-gray-500"> #{log.resource_id}</span>
                            )}
                          </div>
                          {log.tenant && (
                            <div className="text-xs text-gray-500">
                              {log.tenant.name}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.response_status)}`}>
                            {log.response_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(log.risk_level)}`}>
                            {log.risk_level.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">
                            {formatExecutionTime(log.execution_time)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-mono">
                            {log.ip_address}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchLogs(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchLogs(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Audit Log Details</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                ×
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>ID:</strong> {selectedLog.id}</div>
                  <div><strong>Time:</strong> {new Date(selectedLog.performed_at).toLocaleString()}</div>
                  <div><strong>User:</strong> {selectedLog.user_name} ({selectedLog.user_email})</div>
                  <div><strong>Super Admin:</strong> {selectedLog.is_super_admin ? 'Yes' : 'No'}</div>
                  <div><strong>Action:</strong> {selectedLog.action}</div>
                  <div><strong>Resource:</strong> {selectedLog.resource_type} #{selectedLog.resource_id}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Request Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Method:</strong> {selectedLog.method}</div>
                  <div><strong>URL:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{selectedLog.url}</code></div>
                  <div><strong>IP Address:</strong> {selectedLog.ip_address}</div>
                  <div><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedLog.response_status)}`}>{selectedLog.response_status}</span></div>
                  <div><strong>Execution Time:</strong> {formatExecutionTime(selectedLog.execution_time)}</div>
                  <div><strong>Risk Level:</strong> <span className={`px-2 py-1 rounded text-xs ${getRiskLevelColor(selectedLog.risk_level)}`}>{selectedLog.risk_level.toUpperCase()}</span></div>
                </div>
              </div>
            </div>

            {selectedLog.tenant && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Tenant Information</h4>
                <div className="text-sm">
                  <div><strong>Name:</strong> {selectedLog.tenant.name}</div>
                  <div><strong>Slug:</strong> {selectedLog.tenant.slug}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;