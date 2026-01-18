import { useEffect, useState } from 'react';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon,
  ClockIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '../../lib/api';
import { toast } from 'sonner';
import { authService } from '@/services/auth';

interface AnalyticsData {
  overview: {
    total_tenants: number;
    active_tenants: number;
    total_users: number;
    total_revenue: number;
    monthly_revenue: number;
    churn_rate: number;
    growth_rate: number;
  };
  revenue: {
    monthly: Array<{ month: number; year: number; total: number; count: number }>;
    by_plan: Array<{ name: string; total: number; count: number }>;
  };
  performance: {
    active_sessions: number;
    current_load: number;
    memory_usage: { used: string; total: string; percentage: number };
    response_time: number;
    error_rate: number;
  };
  system_health: {
    database: { status: string; response_time?: number };
    cache: { status: string };
    storage: { status: string; free_space?: string };
    queue: { status: string; pending_jobs?: number };
    overall_status: string;
  };
}

const MetricCard = ({ title, value, icon: Icon, status, description }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  status?: 'healthy' | 'warning' | 'error';
  description?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="flex items-center space-x-2">
        <div className="text-2xl font-bold">{value}</div>
        {status && (
          <Badge variant={status === 'healthy' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}>
            {status}
          </Badge>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </CardContent>
  </Card>
);

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedReportType, setSelectedReportType] = useState('tenants');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        toast.error('Please log in to access analytics');
        return;
      }

      const [dashboardResponse, healthResponse] = await Promise.all([
        api.get('/admin/analytics/dashboard'),
        api.get('/admin/analytics/system-health'),
      ]);

      setData({
        ...dashboardResponse.data,
        system_health: healthResponse.data,
      });
    } catch (error: any) {
      console.error('Failed to fetch analytics data:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Super admin privileges required.');
      } else {
        toast.error('An error occurred while loading analytics data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await api.post('/admin/analytics/export', {
        type: selectedReportType,
        format: 'csv',
        period: selectedPeriod,
      });

      const { download_url } = response.data;
      window.open(download_url, '_blank');
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Failed to generate report');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertDescription>
            An error occurred while loading analytics data
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">System performance and business metrics</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedReportType} onValueChange={setSelectedReportType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tenants">Organizations</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="users">Users</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleExportReport}>
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Organizations"
          value={data.overview.total_tenants}
          icon={ChartBarIcon}
        />
        <MetricCard
          title="Active Organizations"
          value={data.overview.active_tenants}
          icon={ChartBarIcon}
        />
        <MetricCard
          title="Total Revenue"
          value={`$${data.overview.total_revenue.toLocaleString()}`}
          icon={ChartBarIcon}
        />
        <MetricCard
          title="Growth Rate"
          value={`${data.overview.growth_rate.toFixed(1)}%`}
          icon={ChartBarIcon}
          status={data.overview.growth_rate > 0 ? 'healthy' : 'warning'}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Sessions"
          value={data.performance.active_sessions}
          icon={ClockIcon}
        />
        <MetricCard
          title="System Load"
          value={`${(data.performance.current_load * 100).toFixed(1)}%`}
          icon={CpuChipIcon}
          status={data.performance.current_load < 0.7 ? 'healthy' : data.performance.current_load < 0.9 ? 'warning' : 'error'}
        />
        <MetricCard
          title="Memory Usage"
          value={data.performance.memory_usage.used}
          icon={CpuChipIcon}
          description={`${data.performance.memory_usage.percentage}% of ${data.performance.memory_usage.total}`}
          status={data.performance.memory_usage.percentage < 70 ? 'healthy' : data.performance.memory_usage.percentage < 90 ? 'warning' : 'error'}
        />
        <MetricCard
          title="Response Time"
          value={`${data.performance.response_time}ms`}
          icon={ClockIcon}
          status={data.performance.response_time < 200 ? 'healthy' : data.performance.response_time < 500 ? 'warning' : 'error'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.revenue.monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs fill-muted-foreground"
                />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
            <CardDescription>Revenue distribution across plans</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.revenue.by_plan}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {data.revenue.by_plan.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Current system component status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Database</span>
              <Badge variant={data.system_health.database.status === 'healthy' ? 'default' : 'destructive'}>
                {data.system_health.database.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Cache</span>
              <Badge variant={data.system_health.cache.status === 'healthy' ? 'default' : 'destructive'}>
                {data.system_health.cache.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Storage</span>
              <Badge variant={data.system_health.storage.status === 'healthy' ? 'default' : 'destructive'}>
                {data.system_health.storage.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Queue</span>
              <Badge variant={data.system_health.queue.status === 'healthy' ? 'default' : 'destructive'}>
                {data.system_health.queue.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}