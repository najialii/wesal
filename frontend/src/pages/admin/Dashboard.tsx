import { useEffect, useState } from 'react';
import { 
  Building2, 
  Users, 
  DollarSign,
  TrendingUp 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { KPICard } from '@/components/dashboard/KPICard';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/currency';
import { defaultChartConfig } from '@/lib/chartConfig';
import api from '../../lib/api';
import type { DashboardStats } from '../../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const response = await api.get('/admin/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-gray-200">
              <CardHeader className="space-y-0 pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64 p-6">
        <Alert className="max-w-md">
          <AlertDescription>
            {error || 'Failed to load dashboard data. Please try refreshing the page.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-h1">Admin Dashboard</h1>
        <p className="text-caption">
          Overview of your system performance and key metrics
        </p>
      </div>

      {/* Key Metrics - Using KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Organizations"
          value={`${stats?.overview?.total_tenants || 0}`}
          icon={Building2}
          period="all time"
        />
        <KPICard
          label="Active Organizations"
          value={`${stats?.overview?.active_tenants || 0}`}
          icon={TrendingUp}
          period="currently active"
          trend="neutral"
        />
        <KPICard
          label="Total Users"
          value={`${stats?.overview?.total_users || 0}`}
          icon={Users}
          period="across all organizations"
        />
        <KPICard
          label="Monthly Revenue"
          value={formatCurrency(stats?.overview?.monthly_revenue || 0)}
          icon={DollarSign}
          period="this month"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-h3">Monthly Revenue</CardTitle>
            <CardDescription className="text-caption">Revenue trends over the past months</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {stats?.revenue?.monthly && stats.revenue.monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.revenue.monthly}>
                  <CartesianGrid {...defaultChartConfig.cartesianGrid} />
                  <XAxis 
                    dataKey="month" 
                    {...defaultChartConfig.xAxis}
                  />
                  <YAxis {...defaultChartConfig.yAxis} />
                  <Tooltip 
                    {...defaultChartConfig.tooltip}
                    formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#088BF8" 
                    strokeWidth={2}
                    dot={{ fill: '#088BF8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No revenue data"
                description="Revenue data will appear here once subscriptions are active"
              />
            )}
          </CardContent>
        </Card>

        {/* Revenue by Plan Chart */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-h3">Revenue by Plan</CardTitle>
            <CardDescription className="text-caption">Revenue breakdown by subscription plan</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {stats?.revenue?.by_plan && stats.revenue.by_plan.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.revenue.by_plan}>
                  <CartesianGrid {...defaultChartConfig.cartesianGrid} />
                  <XAxis 
                    dataKey="name" 
                    {...defaultChartConfig.xAxis}
                  />
                  <YAxis {...defaultChartConfig.yAxis} />
                  <Tooltip 
                    {...defaultChartConfig.tooltip}
                    formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="#088BF8"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={DollarSign}
                title="No plan data"
                description="Plan revenue breakdown will appear here"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Organizations */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-h3">Recent Organizations</CardTitle>
            <CardDescription className="text-caption">Latest organization registrations</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {stats?.recent_activity?.tenants && stats.recent_activity.tenants.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_activity.tenants.map((tenant, index) => (
                  <div key={tenant.id}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                        <p className="text-xs text-gray-500">{tenant.domain}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                          {tenant.plan?.name || 'No Plan'}
                        </Badge>
                        <p className="text-xs text-gray-500">
                          {new Date(tenant.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {index < stats.recent_activity.tenants.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Building2}
                title="No recent organizations"
                description="New organization registrations will appear here"
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Subscriptions */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-h3">Recent Subscriptions</CardTitle>
            <CardDescription className="text-caption">Latest subscription activities</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {stats?.recent_activity?.subscriptions && stats.recent_activity.subscriptions.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_activity.subscriptions.map((subscription, index) => (
                  <div key={subscription.id}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">
                          {subscription.tenant?.name || 'Unknown Organization'}
                        </p>
                        <p className="text-xs text-gray-500">{subscription.plan?.name || 'Unknown Plan'}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(subscription.amount)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(subscription.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {index < stats.recent_activity.subscriptions.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={DollarSign}
                title="No recent subscriptions"
                description="Subscription activities will appear here"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
