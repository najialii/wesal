import { useEffect, useState } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Package,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { useBranch } from '@/contexts/BranchContext';
import api from '../../lib/api';

interface DashboardStats {
  current_branch?: {
    id: number;
    name: string;
    code: string;
  };
  todays_sales: number;
  products_count: number;
  low_stock_count: number;
  users_count: number;
  monthly_revenue: number;
  recent_sales: any[];
  low_stock_products: any[];
  pending_maintenance: number;
  completed_maintenance_today: number;
  weekly_sales: any[];
  monthly_trends: any[];
}

export default function BusinessDashboard() {
  const { t: tDashboard } = useTranslation('dashboard');
  const { isRTL } = useDirectionClasses();
  const { currentBranch, loading: branchLoading } = useBranch();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Wait for branch context to be ready
      if (branchLoading) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/tenant/stats');
        setStats(response.data);
      } catch (error: any) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data');
        // Set empty stats instead of fallback data
        setStats({
          todays_sales: 0,
          products_count: 0,
          low_stock_count: 0,
          users_count: 0,
          monthly_revenue: 0,
          recent_sales: [],
          low_stock_products: [],
          pending_maintenance: 0,
          completed_maintenance_today: 0,
          weekly_sales: [],
          monthly_trends: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [branchLoading, currentBranch?.id]); // Refetch when branch changes

  if (loading || branchLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white border rounded-lg p-6">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to load dashboard</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentBranch) {
    return (
      <div className="p-6">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Branch Selected</h3>
            <p className="text-yellow-700">Please select a branch to view dashboard data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if we have any real data
  const hasData = stats && (
    stats.products_count > 0 || 
    stats.todays_sales > 0 || 
    stats.recent_sales.length > 0 ||
    stats.monthly_revenue > 0
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {tDashboard('welcome_message') || 'Business Overview'}
          </h1>
          <div className="flex items-center gap-2 text-gray-600">
            <span>
              {new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            {currentBranch && (
              <>
                <span>•</span>
                <span className="font-medium">{currentBranch.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Section for New Users */}
      {!hasData && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {isRTL ? 'مرحباً بك في وصال تك' : 'Welcome to WesalTech'}
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {isRTL ? (
                  <>
                    لوحة التحكم جاهزة لـ <span className="font-semibold text-blue-700">{currentBranch?.name}</span>. ابدأ بإكمال هذه الخطوات الأساسية لإعداد عملك.
                  </>
                ) : (
                  <>
                    Your dashboard is ready for <span className="font-semibold text-blue-700">{currentBranch?.name}</span>. Get started by completing these essential steps to set up your business.
                  </>
                )}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">1</span>
                      <h4 className="font-semibold text-gray-900">
                        {isRTL ? 'إضافة المنتجات' : 'Add Products'}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {isRTL 
                        ? 'قم ببناء مخزونك عن طريق إضافة المنتجات مع التفاصيل والأسعار ومستويات المخزون.'
                        : 'Build your inventory by adding products with details, pricing, and stock levels.'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">2</span>
                      <h4 className="font-semibold text-gray-900">
                        {isRTL ? 'إضافة الموظفين' : 'Add Staff'}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {isRTL
                        ? 'قم بدعوة أعضاء الفريق وتعيين الأدوار للتعاون بفعالية.'
                        : 'Invite team members and assign roles to collaborate effectively.'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">3</span>
                      <h4 className="font-semibold text-gray-900">
                        {isRTL ? 'إجراء المبيعات' : 'Make Sales'}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {isRTL
                        ? 'ابدأ بمعالجة المعاملات باستخدام نظام نقاط البيع البديهي.'
                        : 'Start processing transactions using our intuitive POS system.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Today's Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CurrencyDisplay amount={stats?.todays_sales || 0} />
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.products_count || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Staff Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.users_count || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CurrencyDisplay amount={stats?.monthly_revenue || 0} />
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Only show if we have data */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Sales Chart */}
          <Card className="bg-white border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Weekly Sales</CardTitle>
              <p className="text-sm text-gray-500">Sales performance over the last 7 days</p>
            </CardHeader>
            <CardContent>
              {stats?.weekly_sales && stats.weekly_sales.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.weekly_sales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [<CurrencyDisplay amount={Number(value)} showIcon={false} />, 'Sales']}
                    />
                    <Bar 
                      dataKey="sales" 
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>No sales data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Revenue Trend */}
          <Card className="bg-white border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Revenue Trend</CardTitle>
              <p className="text-sm text-gray-500">Monthly revenue and order trends</p>
            </CardHeader>
            <CardContent>
              {stats?.monthly_trends && stats.monthly_trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.monthly_trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value, name) => [
                        name === 'revenue' ? <CurrencyDisplay amount={Number(value)} showIcon={false} /> : value,
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>No trend data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent_sales && stats.recent_sales.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_sales.slice(0, 5).map((sale: any) => (
                  <div key={sale.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{sale.customer_name || 'Walk-in Customer'}</p>
                      <p className="text-sm text-gray-500">#{sale.sale_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        <CurrencyDisplay amount={sale.total_amount} />
                      </p>
                      <p className="text-sm text-gray-500">{sale.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No sales recorded yet</p>
                <p className="text-sm text-gray-400">Start making sales to see them here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <ShoppingCart className="h-6 w-6 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">New Sale</p>
                <p className="text-sm text-gray-500">Start POS</p>
              </button>
              
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Package className="h-6 w-6 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">Add Product</p>
                <p className="text-sm text-gray-500">Manage inventory</p>
              </button>
              
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Users className="h-6 w-6 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">Manage Staff</p>
                <p className="text-sm text-gray-500">Add team members</p>
              </button>
              
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Calendar className="h-6 w-6 text-orange-600 mb-2" />
                <p className="font-medium text-gray-900">Maintenance</p>
                <p className="text-sm text-gray-500">Schedule service</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Section (if applicable) */}
      {(stats?.pending_maintenance || 0) > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Maintenance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="font-semibold text-gray-900">{stats?.pending_maintenance} Pending</p>
                  <p className="text-sm text-gray-600">Maintenance requests</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Calendar className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">{stats?.completed_maintenance_today} Completed</p>
                  <p className="text-sm text-gray-600">Today's services</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}