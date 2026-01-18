import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useTranslation, useDirectionClasses } from '@/lib/translation';
import { formatCurrency } from '@/lib/currency';
import { getImageUrl } from '@/lib/imageUtils';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Product {
  id: number;
  name: string;
  sku: string;
  image?: string;
  selling_price?: number;
  category?: {
    name: string;
  };
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface MaintenanceProduct {
  id: number;
  name: string;
  sku: string;
  selling_price?: number;
  cost_price?: number;
  image?: string;
  category?: {
    name: string;
  };
}

interface FormData {
  product_id: string;
  customer_id: string;
  assigned_technician_id: string;
  frequency: string;
  frequency_value: string;
  frequency_unit: string;
  start_date: string;
  end_date: string;
  contract_value: string;
  maintenance_products: Array<{
    id: number;
    quantity: number;
    unit_cost: number;
  }>;
  special_instructions: string;
  status: string;
}

export default function MaintenanceContractForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation('maintenance');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [maintenanceProducts, setMaintenanceProducts] = useState<MaintenanceProduct[]>([]);
  const [selectedMaintenanceProducts, setSelectedMaintenanceProducts] = useState<Array<{ product: MaintenanceProduct; quantity: number; unit_cost: number }>>([]);
  
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Store maintenance product search state
  const [maintenanceProductSearch, setMaintenanceProductSearch] = useState('');
  const [showMaintenanceProductDropdown, setShowMaintenanceProductDropdown] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    product_id: '',
    customer_id: '',
    assigned_technician_id: '',
    frequency: 'monthly',
    frequency_value: '',
    frequency_unit: 'months',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    contract_value: '',
    maintenance_products: [],
    special_instructions: '',
    status: 'active',
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
      if (id) {
        await fetchContract();
      }
    };
    loadData();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.product-search-container') && !target.closest('.maintenance-product-search-container')) {
        setShowProductDropdown(false);
        setShowMaintenanceProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching form data...');
      const [productsRes, customersRes, usersRes, sparePartsRes] = await Promise.all([
        api.get('/tenant/products?per_page=1000&is_spare_part=0'), // Only regular products for main product
        api.get('/tenant/customers?per_page=1000'),
        api.get('/tenant/staff?per_page=1000'),
        api.get('/tenant/products?per_page=1000&is_spare_part=1'), // Temporarily use spare parts again
      ]);

      console.log('Products Response:', productsRes.data);
      console.log('Customers Response:', customersRes.data);
      console.log('Users Response:', usersRes.data);
      console.log('Spare Parts Response:', sparePartsRes.data);

      // Handle paginated responses
      const productsList = productsRes.data.data || productsRes.data || [];
      const customersList = customersRes.data.data || customersRes.data || [];
      const staffList = usersRes.data.data || usersRes.data || [];
      const sparePartsList = sparePartsRes.data.data || sparePartsRes.data || [];

      console.log('Parsed Products:', productsList);
      console.log('Parsed Customers:', customersList);
      console.log('Parsed Staff:', staffList);
      console.log('Parsed Spare Parts:', sparePartsList);
      console.log('Spare Parts Count:', sparePartsList.length);

      setProducts(productsList); // Regular products only
      setCustomers(customersList);
      
      // Use spare parts as maintenance products temporarily
      setMaintenanceProducts(sparePartsList);
      console.log('Set maintenance products:', sparePartsList);
      
      // Filter for technicians and admins (who can be assigned to contracts)
      const technicianStaff = staffList.filter((user: any) => {
        const hasRole = user.roles?.some((r: any) => 
          r.name === 'technician' || r.name === 'tenant_admin' || r.name === 'manager'
        );
        console.log(`User ${user.name} has technician role:`, hasRole, user.roles);
        return hasRole;
      });
      console.log('Filtered Technicians:', technicianStaff);
      setTechnicians(technicianStaff);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      console.error('Error response:', error.response?.data);
      toast.error(t('failedToLoadData', { fallback: 'Failed to load form data' }));
    }
  };

  const fetchContract = async () => {
    try {
      setLoading(true);
      console.log('Fetching contract with ID:', id);
      const response = await api.get(`/maintenance/contracts/${id}`);
      console.log('Contract response:', response.data);
      const contract = response.data.data || response.data;
      
      console.log('Contract data:', contract);
      
      setFormData({
        product_id: contract.product_id?.toString() || '',
        customer_id: contract.customer_id?.toString() || '',
        assigned_technician_id: contract.assigned_technician_id?.toString() || '',
        frequency: contract.frequency || 'monthly',
        frequency_value: contract.frequency_value?.toString() || '',
        frequency_unit: contract.frequency_unit || 'months',
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
        contract_value: contract.contract_value?.toString() || '',
        maintenance_products: contract.items || contract.maintenance_products || [],
        special_instructions: contract.special_instructions || '',
        status: contract.status || 'active',
      });

      // Set selected product if exists
      if (contract.product_id && contract.product) {
        console.log('Setting selected product:', contract.product);
        setSelectedProduct(contract.product);
      }

      // Convert contract items to the format expected by the form
      if (contract.items && contract.items.length > 0) {
        console.log('Converting contract items:', contract.items);
        const convertedProducts = contract.items.map((item: any) => ({
          product: item.product || item.maintenanceProduct || { 
            id: item.maintenance_product_id, 
            name: item.product?.name || 'Unknown Product', 
            sku: item.product?.sku || 'N/A',
            selling_price: item.product?.selling_price || item.unit_cost
          },
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        }));
        console.log('Converted products:', convertedProducts);
        setSelectedMaintenanceProducts(convertedProducts);
      } else if (contract.maintenance_products) {
        console.log('Using legacy maintenance_products format:', contract.maintenance_products);
        // Handle legacy format
        const convertedProducts = contract.maintenance_products.map((item: any) => {
          const product = maintenanceProducts.find(p => p.id === item.id);
          return {
            product: product || { id: item.id, name: 'Unknown Product', sku: 'N/A' },
            quantity: item.quantity,
            unit_cost: item.unit_cost,
          };
        });
        setSelectedMaintenanceProducts(convertedProducts);
      }
    } catch (error: any) {
      console.error('Failed to fetch contract:', error);
      console.error('Error response:', error.response?.data);
      toast.error(t('failedToLoadContract', { fallback: 'Failed to load contract' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.customer_id || !formData.assigned_technician_id) {
      toast.error(t('fillRequired', { fallback: 'Please fill all required fields' }));
      return;
    }

    try {
      setLoading(true);
      
      // Filter out products with id = 0 and convert to the expected format
      const validProducts = selectedMaintenanceProducts
        .filter(item => item.product.id > 0)
        .map(item => ({
          id: item.product.id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        }));
      
      const payload = {
        ...formData,
        maintenance_products: validProducts,
      };

      console.log('Submitting contract with payload:', payload);

      if (id) {
        await api.put(`/maintenance/contracts/${id}`, payload);
        toast.success(t('contractUpdated', { fallback: 'Contract updated successfully' }));
      } else {
        await api.post('/maintenance/contracts', payload);
        toast.success(t('contractCreated', { fallback: 'Contract created successfully' }));
      }
      
      navigate('/business/maintenance');
    } catch (error: any) {
      console.error('Failed to save contract:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || t('failedToSave', { fallback: 'Failed to save contract' }));
    } finally {
      setLoading(false);
    }
  };

  const addMaintenanceProduct = (product: MaintenanceProduct) => {
    // Check if product is already added
    const existingIndex = selectedMaintenanceProducts.findIndex(item => item.product.id === product.id);
    if (existingIndex >= 0) {
      // Update quantity if already exists
      const updated = [...selectedMaintenanceProducts];
      updated[existingIndex].quantity += 1;
      setSelectedMaintenanceProducts(updated);
    } else {
      // Add new product
      setSelectedMaintenanceProducts([
        ...selectedMaintenanceProducts,
        {
          product,
          quantity: 1,
          unit_cost: Number(product.selling_price) || 0,
        }
      ]);
    }
    
    // Clear search
    setMaintenanceProductSearch('');
    setShowMaintenanceProductDropdown(false);
  };

  const removeMaintenanceProduct = (index: number) => {
    setSelectedMaintenanceProducts(selectedMaintenanceProducts.filter((_, i) => i !== index));
  };

  const updateMaintenanceProductQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeMaintenanceProduct(index);
      return;
    }
    
    const updated = [...selectedMaintenanceProducts];
    updated[index].quantity = quantity;
    setSelectedMaintenanceProducts(updated);
  };

  const updateMaintenanceProductCost = (index: number, cost: number) => {
    const updated = [...selectedMaintenanceProducts];
    updated[index].unit_cost = cost;
    setSelectedMaintenanceProducts(updated);
  };

  const calculateTotalCost = () => {
    return selectedMaintenanceProducts.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_cost);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className={`flex items-center gap-4 mb-8`}>
          <button
            onClick={() => navigate('/business/maintenance')}
            className="p-2 hover:bg-white rounded-lg transition-all shadow-sm border border-gray-200"
          >
            <ArrowLeftIcon className={`h-5 w-5 text-gray-600 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {id ? t('editContract', { fallback: 'Edit Contract' }) : t('createContract', { fallback: 'Create New Contract' })}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {t('contractFormSubtitle', { fallback: 'Complete the form below to set up a maintenance contract' })}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b">
              {t('basicInformation', { fallback: 'Basic Information' })}
            </h2>
            
            <div className="space-y-5">
              {/* Product & Customer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="relative product-search-container">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('product', { fallback: 'Product' })} <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedProduct ? selectedProduct.name : productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                        if (selectedProduct) {
                          setSelectedProduct(null);
                          setFormData({ ...formData, product_id: '' });
                        }
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      placeholder={t('searchProduct', { fallback: 'Search for a product...' })}
                      className="w-full px-4 py-3 pr-10 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Dropdown */}
                  {showProductDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                      {products
                        .filter(p => 
                          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(productSearch.toLowerCase())
                        )
                        .slice(0, 10)
                        .map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => {
                              setSelectedProduct(product);
                              setFormData({ ...formData, product_id: product.id.toString() });
                              setShowProductDropdown(false);
                              setProductSearch('');
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            {/* Product Image */}
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                              {product.image ? (
                                <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            
                            {/* Product Info */}
                            <div className="flex-1 text-left">
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-xs text-gray-500">
                                SKU: {product.sku}
                                {product.category && ` • ${product.category.name}`}
                              </div>
                            </div>
                            
                            {/* Price */}
                            {product.selling_price && (
                              <div className="text-sm font-semibold text-primary-600">
                                ${Number(product.selling_price).toFixed(2)}
                              </div>
                            )}
                          </button>
                        ))}
                      
                      {products.filter(p => 
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(productSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          {t('noProductsFound', { fallback: 'No products found' })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Product Display */}
                  {selectedProduct && (
                    <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-white flex-shrink-0 overflow-hidden">
                        {selectedProduct.image ? (
                          <img src={getImageUrl(selectedProduct.image)} alt={selectedProduct.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{selectedProduct.name}</div>
                        <div className="text-xs text-gray-600">SKU: {selectedProduct.sku}</div>
                      </div>
                      {selectedProduct.selling_price && (
                        <div className="text-sm font-semibold text-primary-700">
                          ${Number(selectedProduct.selling_price).toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('customer', { fallback: 'Customer' })} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                  >
                    <option value="">{t('selectCustomer', { fallback: '-- Select Customer --' })}</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} {customer.phone && `(${customer.phone})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Technician */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('assignedTechnician', { fallback: 'Assigned Technician' })} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.assigned_technician_id}
                  onChange={(e) => setFormData({ ...formData, assigned_technician_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  required
                >
                  <option value="">{t('selectTechnician', { fallback: '-- Select Technician --' })}</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} ({tech.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b">
              {t('scheduleSettings', { fallback: 'Schedule & Timing' })}
            </h2>
            
            <div className="space-y-5">
              {/* Frequency */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('frequency', { fallback: 'Maintenance Frequency' })} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  required
                >
                  <option value="once">{t('once', { fallback: 'One Time' })}</option>
                  <option value="weekly">{t('weekly', { fallback: 'Weekly' })}</option>
                  <option value="monthly">{t('monthly', { fallback: 'Monthly' })}</option>
                  <option value="quarterly">{t('quarterly', { fallback: 'Quarterly' })}</option>
                  <option value="semi_annual">{t('semiAnnual', { fallback: 'Semi-Annual' })}</option>
                  <option value="annual">{t('annual', { fallback: 'Annual' })}</option>
                  <option value="custom">{t('custom', { fallback: 'Custom Interval' })}</option>
                </select>
              </div>

              {formData.frequency === 'custom' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('every', { fallback: 'Every' })}
                    </label>
                    <input
                      type="number"
                      value={formData.frequency_value}
                      onChange={(e) => setFormData({ ...formData, frequency_value: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="1"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('unit', { fallback: 'Time Unit' })}
                    </label>
                    <select
                      value={formData.frequency_unit}
                      onChange={(e) => setFormData({ ...formData, frequency_unit: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="days">{t('days', { fallback: 'Days' })}</option>
                      <option value="weeks">{t('weeks', { fallback: 'Weeks' })}</option>
                      <option value="months">{t('months', { fallback: 'Months' })}</option>
                      <option value="years">{t('years', { fallback: 'Years' })}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Dates - Full Width */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('startDate', { fallback: 'Contract Start Date' })} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('endDate', { fallback: 'Contract End Date' })} <span className="text-gray-500 text-xs font-normal">{t('optional', { fallback: '(Optional)' })}</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Products Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className={`flex items-center justify-between mb-4 pb-3 border-b`}>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('maintenanceProducts', { fallback: 'Spare Parts & Products' })}
              </h2>
            </div>

            {/* Search for Spare Parts */}
            <div className="mb-6">
              <div className="relative maintenance-product-search-container">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('searchSpareParts', { fallback: 'Search Spare Parts' })}
                </label>
                
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={maintenanceProductSearch}
                    onChange={(e) => {
                      setMaintenanceProductSearch(e.target.value);
                      setShowMaintenanceProductDropdown(true);
                    }}
                    onFocus={() => setShowMaintenanceProductDropdown(true)}
                    placeholder={t('searchSpareParts', { fallback: 'Search for spare parts...' })}
                    className="w-full px-4 py-3 pr-10 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Dropdown */}
                {showMaintenanceProductDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    {maintenanceProducts
                      .filter(p => 
                        p.name.toLowerCase().includes(maintenanceProductSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(maintenanceProductSearch.toLowerCase())
                      )
                      .slice(0, 10)
                      .map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addMaintenanceProduct(product)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          {/* Product Image */}
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                            {product.image ? (
                              <img 
                                src={getImageUrl(product.image)}
                                alt={product.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&size=48&background=f3f4f6&color=6b7280&format=svg`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 text-left">
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-500">
                              SKU: {product.sku}
                              {product.category && ` • ${product.category.name}`}
                            </div>
                          </div>
                          
                          {/* Price */}
                          <div className="text-sm font-semibold text-primary-600">
                            ${Number(product.selling_price || 0).toFixed(2)}
                          </div>
                        </button>
                      ))}
                    
                    {maintenanceProducts.filter(p => 
                      p.name.toLowerCase().includes(maintenanceProductSearch.toLowerCase()) ||
                      p.sku.toLowerCase().includes(maintenanceProductSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {maintenanceProducts.length === 0 
                          ? t('noSparePartsAvailable', { fallback: 'No spare parts available. Please mark some products as spare parts first.' })
                          : t('noProductsFound', { fallback: 'No products found' })
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Products List */}
            {selectedMaintenanceProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">{t('noSparePartsSelected', { fallback: 'No spare parts selected' })}</p>
                <p className="text-xs text-gray-500 mt-1">{t('searchAndSelectSpareParts', { fallback: 'Search and select spare parts above to add them to this contract.' })}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedMaintenanceProducts.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                            {item.product.image ? (
                              <img 
                                src={getImageUrl(item.product.image)}
                                alt={item.product.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product.name)}&size=40&background=f3f4f6&color=6b7280&format=svg`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{item.product.name}</div>
                            <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
                          </div>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="w-24">
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('quantity', { fallback: 'Qty' })}</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateMaintenanceProductQuantity(index, parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm rounded border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      {/* Unit Cost */}
                      <div className="w-28">
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('unitCost', { fallback: 'Unit Cost' })}</label>
                        <input
                          type="number"
                          value={item.unit_cost}
                          onChange={(e) => updateMaintenanceProductCost(index, parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm rounded border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      {/* Total */}
                      <div className="w-24 text-right">
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('total', { fallback: 'Total' })}</label>
                        <div className="text-sm font-semibold text-gray-900">
                          ${(item.quantity * item.unit_cost).toFixed(2)}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div>
                        <button
                          type="button"
                          onClick={() => removeMaintenanceProduct(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('remove', { fallback: 'Remove' })}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total Cost */}
                <div className="flex justify-end pt-4 border-t-2 border-gray-300">
                  <div className="bg-primary-50 px-6 py-3 rounded-lg">
                    <span className="text-sm text-gray-600 mr-3">{t('totalCost', { fallback: 'Total Parts Cost' })}:</span>
                    <span className="text-2xl font-bold text-primary-700">{formatCurrency(calculateTotalCost())}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contract Value & Notes Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b">
              {t('additionalDetails', { fallback: 'Additional Details' })}
            </h2>
            
            <div className="space-y-5">
              {/* Contract Value */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('contractValue', { fallback: 'Total Contract Value' })}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    value={formData.contract_value}
                    onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {t('contractValueHint', { fallback: 'Total contract value (can be different from parts cost)' })}
                </p>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('specialInstructions', { fallback: 'Special Instructions & Notes' })}
                </label>
                <textarea
                  value={formData.special_instructions}
                  onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                  placeholder={t('instructionsPlaceholder', { fallback: 'Enter any special notes, requirements, or instructions for this contract...' })}
                />
              </div>

              {/* Status (only for edit) */}
              {id && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('status', { fallback: 'Contract Status' })}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="active">{t('active', { fallback: 'Active' })}</option>
                    <option value="paused">{t('paused', { fallback: 'Paused' })}</option>
                    <option value="completed">{t('completed', { fallback: 'Completed' })}</option>
                    <option value="cancelled">{t('cancelled', { fallback: 'Cancelled' })}</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <button
              type="button"
              onClick={() => navigate('/business/maintenance')}
              className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all"
            >
              {t('cancel', { fallback: 'Cancel' })}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {loading ? t('saving', { fallback: 'Saving...' }) : t('save', { fallback: 'Save Contract' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
