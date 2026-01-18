import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon, EyeIcon, PencilIcon, ChartBarIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { SalesEditModal } from '@/components/modals/SalesEditModal';
import { SalesDetailModal } from '@/components/modals/SalesDetailModal';
import { toast } from 'sonner';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import { formatCurrency } from '@/lib/currency';
import api from '../../lib/api';
import { useBranch } from '../../contexts/BranchContext';

interface Sale {
  id: number;
  sale_number: string;
  customer_name: string;
  customer_phone?: string;
  total_amount: string | number;
  payment_method: string;
  payment_status: string;
  sale_date: string;
  items_count?: number;
  branch?: {
    id: number;
    name: string;
    code: string;
  };
}

export default function Sales() {
  const { t } = useTranslation('sales');
  const { isRTL } = useDirectionClasses();
  const { currentBranch } = useBranch();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);

  useEffect(() => {
    fetchSales();
  }, [search, dateFilter, currentBranch]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number | undefined> = { 
        search: search || undefined,
        date: dateFilter || undefined,
        branch_id: currentBranch?.id
      };
      
      const response = await api.get('/pos/daily-sales', { params });
      setSales(response.data.sales || []);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      setSales([]);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSale = (saleId: number) => {
    setSelectedSaleId(saleId);
    setEditModalOpen(true);
  };

  const handleViewSale = (saleId: number) => {
    setSelectedSaleId(saleId);
    setDetailModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchSales();
    toast.success('Sale updated successfully');
  };

  const handleCloseModals = () => {
    setEditModalOpen(false);
    setDetailModalOpen(false);
    setSelectedSaleId(null);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">
            {t('sales', { fallback: 'Sales' })}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('salesDescription', { fallback: 'View and manage your sales transactions' })}
          </p>
        </div>
        {currentBranch && (
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
            <BuildingStorefrontIcon className="h-5 w-5 text-blue-600" />
            <span className="text-blue-700 font-medium">{currentBranch.name}</span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0))}
          </div>
          <div className="text-sm text-gray-500">{t('totalSales', { fallback: 'Total Sales' })}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl font-bold text-gray-900">{sales.length}</div>
          <div className="text-sm text-gray-500">{t('transactions', { fallback: 'Transactions' })}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl font-bold text-green-600">
            {sales.filter(s => s.payment_status === 'paid').length}
          </div>
          <div className="text-sm text-gray-500">{t('paid', { fallback: 'Paid' })}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl font-bold text-yellow-600">
            {sales.filter(s => s.payment_status === 'pending').length}
          </div>
          <div className="text-sm text-gray-500">{t('pending', { fallback: 'Pending' })}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className={`h-5 w-5 absolute top-3 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={t('searchSales', { fallback: 'Search by customer or invoice...' })}
              className={`w-full rounded-lg border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all duration-200 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <input
            type="date"
            className="rounded-lg border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all duration-200 py-3"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          
          <button
            onClick={() => {
              setSearch('');
              setDateFilter('');
            }}
            className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            {t('clearFilters', { fallback: 'Clear Filters' })}
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('invoice', { fallback: 'Invoice' })}
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('customer', { fallback: 'Customer' })}
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('amount', { fallback: 'Amount' })}
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('payment', { fallback: 'Payment' })}
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('date', { fallback: 'Date' })}
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('actions', { fallback: 'Actions' })}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{sale.sale_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`h-10 w-10 flex-shrink-0 ${isRTL ? 'ml-3' : 'mr-3'}`}>
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-100 to-secondary-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-700">
                              {sale.customer_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{sale.customer_name}</div>
                          {sale.customer_phone && (
                            <div className="text-sm text-gray-500">{sale.customer_phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(Number(sale.total_amount))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(sale.payment_status)}`}>
                          {t(`paymentStatus.${sale.payment_status}`, { fallback: sale.payment_status })}
                        </span>
                        <div className="text-sm text-gray-500 mt-1">
                          {t(`paymentMethod.${sale.payment_method}`, { fallback: sale.payment_method })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sale.sale_date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                      <button 
                        onClick={() => handleViewSale(sale.id)}
                        className="text-primary-600 hover:text-primary-900 p-2 rounded-lg hover:bg-primary-50 transition-colors duration-200"
                        title={t('viewDetails', { fallback: 'View Details' })}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditSale(sale.id)}
                        className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        title={t('editSale', { fallback: 'Edit Sale' })}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sales.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="text-gray-500">
                  <h3 className="text-lg font-medium">{t('noSalesFound', { fallback: 'No sales found' })}</h3>
                  <p className="mt-1">{t('salesWillAppear', { fallback: 'Sales will appear here once you start processing transactions.' })}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedSaleId && (
        <>
          <SalesEditModal
            isOpen={editModalOpen}
            onClose={handleCloseModals}
            saleId={selectedSaleId}
            onSuccess={handleEditSuccess}
          />
          <SalesDetailModal
            isOpen={detailModalOpen}
            onClose={handleCloseModals}
            saleId={selectedSaleId}
          />
        </>
      )}
    </div>
  );
}
