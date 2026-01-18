import { useEffect, useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import CustomerModal from '../../components/modals/CustomerModal';

interface Customer {
  id: number;
  name: string;
  phone?: string;
  secondary_phone?: string;
  address?: string;
  email?: string;
  type: 'individual' | 'business';
  tax_number?: string;
  credit_limit: number | string;
  current_balance: number | string;
  is_active: boolean;
  notes?: string;
  sales_count?: number;
  total_purchases?: number | string;
  last_purchase_date?: string;
}

export default function Customers() {
  const { t } = useTranslation('customers');
  const { isRTL } = useDirectionClasses();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Utility function to safely format currency
  const formatCurrency = (value: number | string | null | undefined): string => {
    const numValue = Number(value || 0);
    return numValue.toFixed(2);
  };
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [search, typeFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenant/customers', {
        params: { 
          search, 
          type: typeFilter || undefined,
          per_page: 50 
        }
      });
      setCustomers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowModal(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(t('confirmDelete', { fallback: 'Are you sure you want to delete this customer?' }))) {
      return;
    }

    try {
      await api.delete(`/tenant/customers/${customer.id}`);
      await fetchCustomers();
    } catch (error: any) {
      alert(error.response?.data?.message || t('deleteError', { fallback: 'Failed to delete customer' }));
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCustomer(null);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setEditingCustomer(null);
    fetchCustomers();
  };

  const getCustomerTypeColor = (type: string) => {
    return type === 'business' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      {/* Header */}
      <div className={`flex items-center ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">
            {t('customers', { fallback: 'Customers' })}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('customersDescription', { fallback: 'Manage your customer database and relationships' })}
          </p>
          <p className="mt-1 text-xs text-blue-600 font-medium">
            {t('tenantWideNote', { fallback: '✓ Customers are shared across all branches' })}
          </p>
        </div>
        <button 
          onClick={handleAddCustomer}
          className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transform hover:scale-[1.02] transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <PlusIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('addCustomer', { fallback: 'Add Customer' })}
        </button>
      </div>


{/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
          <div className="text-sm text-gray-500">{t('totalCustomers', { fallback: 'Total Customers' })}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl font-bold text-green-600">
            {customers.filter(c => c.is_active).length}
          </div>
          <div className="text-sm text-gray-500">{t('active', { fallback: 'Active' })}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl font-bold text-blue-600">
            {customers.filter(c => c.type === 'business').length}
          </div>
          <div className="text-sm text-gray-500">{t('business', { fallback: 'Business' })}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl font-bold text-purple-600">
            {customers.filter(c => Number(c.credit_limit || 0) > 0).length}
          </div>
          <div className="text-sm text-gray-500">{t('withCredit', { fallback: 'With Credit' })}</div>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className={`h-5 w-5 absolute top-3 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={t('searchCustomers', { fallback: 'Search customers...' })}
              className={`w-full rounded-lg border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all duration-200 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all duration-200 py-3"
          >
            <option value="">{t('allTypes', { fallback: 'All Types' })}</option>
            <option value="individual">{t('individual', { fallback: 'Individual' })}</option>
            <option value="business">{t('business', { fallback: 'Business' })}</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
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
                    {t('customer', { fallback: 'Customer' })}
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('contact', { fallback: 'Contact' })}
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('type', { fallback: 'Type' })}
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('credit', { fallback: 'Credit' })}
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('status', { fallback: 'Status' })}
                  </th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('actions', { fallback: 'Actions' })}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`h-10 w-10 flex-shrink-0 ${isRTL ? 'ml-3' : 'mr-3'}`}>
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-100 to-secondary-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-700">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{customer.name}</div>
                          {customer.tax_number && (
                            <div className="text-sm text-gray-500">Tax: {customer.tax_number}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.phone || '-'}</div>
                      {customer.email && (
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getCustomerTypeColor(customer.type)}`}>
                        {t(customer.type, { fallback: customer.type })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${formatCurrency(customer.credit_limit)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t('balance', { fallback: 'Balance' })}: ${formatCurrency(customer.current_balance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.is_active)}`}>
                        {customer.is_active ? t('active', { fallback: 'Active' }) : t('inactive', { fallback: 'Inactive' })}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                      <button 
                        onClick={() => handleEditCustomer(customer)}
                        className="text-primary-600 hover:text-primary-900 p-2 rounded-lg hover:bg-primary-50 transition-colors duration-200"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCustomer(customer)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {customers.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-500">{t('noCustomers', { fallback: 'No customers found' })}</h3>
                <p className="mt-1 text-gray-400">{t('getStarted', { fallback: 'Get started by adding your first customer.' })}</p>
              </div>
            )}
          </div>
        )}
      </div>

      

      {/* Customer Modal */}
      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}