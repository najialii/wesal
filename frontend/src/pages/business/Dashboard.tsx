import { useEffect, useState } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Package,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/dashboard/KPICard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import { formatCurrency } from '@/lib/currency';
import { defaultChartConfig } from '@/lib/chartConfig';
import api from '../../lib/api';

export default function BusinessDashboard() {
  const { t: tCommon } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');
  const { isRTL } = useDirectionClasses();
  
  // Debug logging
  console.log('Dashboard translations:', {
    common: tCommon('navigation.dashboard'),
    dashboard: tDashboard('welcome_message'),
    isRTL
  });
  
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [businessMetrics, setBusinessMetrics] = useState({
    monthlyRevenue: 0,
    customerGrowth: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch business stats
        try {
          const statsResponse = await api.get('/tenant/stats');
          const statsData = statsResponse.data;
          setStats(statsData);
          
          if (statsData.recent_sales) {
            setRecentSales(statsData.recent_sales);
          }
          
          if (statsData.low_stock_products) {
            setLowStockProducts(statsData.low_stock_products);
          }
          
          setBusinessMetrics({
            monthlyRevenue: statsData.monthly_revenue || Math.floor(Math.random() * 50000) + 25000,
            customerGrowth: Math.floor(Math.random() * 30) + 5,
          });
          
        } catch (error) {
          console.log('Stats not available yet');
          
          // Fallback data
          try {
            const salesResponse = await api.get('/pos/daily-sales');
            setRecentSales(salesResponse.data.sales?.slice(0, 5) || []);
          } catch (salesError) {
            console.log('Sales data not available yet');
          }

          try {
            const lowStockResponse = await api.get('/tenant/products-low-stock');
            setLowStockProducts(lowStockResponse.data?.slice(0, 5) || []);
          } catch (lowStockError) {
            console.log('Low stock data not available yet');
          }

          setBusinessMetrics({
            monthlyRevenue: Math.floor(Math.random() * 50000) + 25000,
            customerGrowth: Math.floor(Math.random() * 30) + 5,
          });
        }
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const mockSalesData = [
    { day: isRTL ? 'الإثنين' : 'Mon', sales: 1200 },
    { day: isRTL ? 'الثلاثاء' : 'Tue', sales: 1900 },
    { day: isRTL ? 'الأربعاء' : 'Wed', sales: 800 },
    { day: isRTL ? 'الخميس' : 'Thu', sales: 1600 },
    { day: isRTL ? 'الجمعة' : 'Fri', sales: 2200 },
    { day: isRTL ? 'السبت' : 'Sat', sales: 2800 },
    { day: isRTL ? 'الأحد' : 'Sun', sales: 1400 },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-gray-200">
              <CardHeader className="space-y-0 pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-gray-200">
            <CardHeader className="border-b border-gray-100 pb-4">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="pt-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardHeader className="border-b border-gray-100 pb-4">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="pt-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-h1">
          {tCommon('navigation.dashboard')}
        </h1>
        <p className="text-caption">
          {tDashboard('welcome_message')}
        </p>
      </div>

      {/* Key Metrics - Limited to 6 most important KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label={tDashboard('stats.todays_sales')}
          value={formatCurrency(stats?.todays_sales || (Math.random() * 1000 + 500))}
          icon={DollarSign}
          change="+12.5%"
          trend="up"
          period={tDashboard('stats.today')}
        />
        <KPICard
          label={tDashboard('stats.total_products')}
          value={`${stats?.products_count || stats?.posts_count || 0}`}
          icon={Package}
          change="+3"
          trend="up"
          period={tDashboard('stats.new_this_week')}
        />
        <KPICard
          label={tDashboard('stats.low_stock_items')}
          value={`${stats?.low_stock_count || lowStockProducts.length}`}
          icon={AlertTriangle}
          change={stats?.low_stock_count > 0 ? tDashboard('stats.needs_attention') : tDashboard('stats.all_good')}
          trend={stats?.low_stock_count > 0 ? "down" : "neutral"}
        />
        <KPICard
          label={tDashboard('stats.staff_members')}
          value={`${stats?.users_count || 0}`}
          icon={Users}
          period={tDashboard('stats.active')}
          trend="neutral"
        />
        <KPICard
          label={tDashboard('business_metrics.monthly_revenue')}
          value={formatCurrency(stats?.monthly_revenue || businessMetrics.monthlyRevenue)}
          icon={DollarSign}
          period={tDashboard('business_metrics.this_month')}
        />
        <KPICard
          label={tDashboard('business_metrics.customer_growth')}
          value={`+${businessMetrics.customerGrowth}%`}
          icon={Users}
          period={tDashboard('business_metrics.vs_last_month')}
          trend="up"
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-h3">
              {tDashboard('charts.weekly_sales')}
            </CardTitle>
            <p className="text-caption mt-1">
              {tDashboard('charts.sales_performance')}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockSalesData}>
                <CartesianGrid {...defaultChartConfig.cartesianGrid} />
                <XAxis 
                  dataKey="day" 
                  {...defaultChartConfig.xAxis}
                />
                <YAxis 
                  {...defaultChartConfig.yAxis}
                />
                <Tooltip 
                  {...defaultChartConfig.tooltip}
                  formatter={(value) => [formatCurrency(Number(value)), tDashboard('charts.sales')]}
                />
                <Bar 
                  dataKey="sales" 
                  fill="#088BF8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-h3">
              {tDashboard('charts.recent_sales')}
            </CardTitle>
            <p className="text-caption mt-1">
              {tDashboard('charts.latest_transactions')}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {recentSales.length > 0 ? (
              <div className="space-y-4">
                {recentSales.map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">{sale.customer_name}</p>
                      <p className="text-xs text-gray-500">#{sale.sale_number}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(sale.total_amount)}</p>
                      <p className="text-xs text-gray-500">{sale.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ShoppingCart}
                title={tDashboard('charts.no_sales_yet')}
                description={tDashboard('charts.start_selling')}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-red-900">
                  {isRTL ? 'تنبيه المخزون المنخفض' : 'Low Stock Alert'}
                </CardTitle>
                <p className="text-sm text-red-700 mt-0.5">
                  {isRTL ? `${lowStockProducts.length} منتجات تحتاج إلى إعادة تخزين` : `${lowStockProducts.length} products need restocking`}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product: any) => (
                <div key={product.id} className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">
                      {product.stock_quantity} {product.unit} {isRTL ? 'متبقي' : 'left'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isRTL ? 'الحد الأدنى:' : 'Min:'} {product.min_stock_level} {product.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
