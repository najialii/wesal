import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '../../lib/api';
import { getProductImageUrl } from '@/lib/imageUtils';

interface Product {
  id: number;
  name: string;
  sku: string;
  selling_price: number;
  image?: string;
}

interface Worker {
  id: number;
  name: string;
  job_title: string;
  phone?: string;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface MaintenanceProduct {
  product_id: number;
  product_name: string;
  quantity: number;
  notes: string;
}

interface MaintenanceFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  scheduled_date: string;
  scheduled_time: string;
  assigned_worker_id: number | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  work_description: string;
  products: MaintenanceProduct[];
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom';
  frequency_value?: number;
  frequency_unit?: 'days' | 'weeks' | 'months' | 'years';
  contract_value: number;
  special_instructions: string;
  start_date: string;
  end_date: string;
}

export default function MaintenanceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('maintenance');
  const { isRTL } = useDirectionClasses();
  const isEditing = Boolean(id);
  const [formData, setFormData] = useState<MaintenanceFormData>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    scheduled_date: '',
    scheduled_time: '',
    assigned_worker_id: null,
    priority: 'medium',
    work_description: '',
    products: [],
    frequency: 'monthly',
    frequency_value: 1,
    frequency_unit: 'months',
    contract_value: 0,
    special_instructions: '',
    start_date: '',
    end_date: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showProductSelector, setShowProductSelector] = useState(false);

  useEffect(() => {
    fetchInitialData();
    if (isEditing) {
      fetchMaintenanceData();
    }
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const [productsRes, workersRes, customersRes] = await Promise.all([
        api.get('/tenant/products'),
        api.get('/maintenance/workers'),
        api.get('/tenant/customers')
      ]);

      setProducts(productsRes.data.data || productsRes.data || []);
      setWorkers(workersRes.data.workers || []);
      setCustomers(customersRes.data.data || customersRes.data || []);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      toast.error(t('failedToLoadData', { fallback: 'Failed to load data' }));
    } finally {
      setLoadingData(false);
    }
  };

  const fetchMaintenanceData = async () => {
    try {
      const response = await api.get(`/business/maintenance/visits/${id}`);
      const visit = response.data.visit;
      
      setFormData({
        customer_name: visit.contract.customer_name,
        customer_phone: visit.contract.customer_phone || '',
        customer_email: visit.contract.customer_email || '',
        customer_address: visit.contract.customer_address || '',
        scheduled_date: visit.scheduled_date,
        scheduled_time: visit.scheduled_time || '',
        assigned_worker_id: visit.assigned_worker_id,
        priority: visit.priority,
        work_description: visit.work_description || '',
        products: visit.contract.product ? [{
          product_id: visit.contract.product.id,
          product_name: visit.contract.product.name,
          quantity: 1,
          notes: ''
        }] : [],
        frequency: visit.contract.frequency || 'monthly',
        frequency_value: visit.contract.frequency_value || 1,
        frequency_unit: visit.contract.frequency_unit || 'months',
        contract_value: visit.contract.contract_value || 0,
        special_instructions: visit.contract.special_instructions || '',
        start_date: visit.contract.start_date || '',
        end_date: visit.contract.end_date || ''
      });
    } catch (error) {
      console.error('Failed to fetch maintenance data:', error);
      toast.error(t('failedToLoadMaintenance', { fallback: 'Failed to load maintenance data' }));
    }
  }; 
 const handleInputChange = (field: keyof MaintenanceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addProduct = (product: Product) => {
    const existingProduct = formData.products.find(p => p.product_id === product.id);
    if (existingProduct) {
      toast.error(t('productAlreadyAdded', { fallback: 'Product already added' }));
      return;
    }

    const newProduct: MaintenanceProduct = {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      notes: ''
    };

    setFormData(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }));
    setShowProductSelector(false);
  };

  const updateProduct = (index: number, field: keyof MaintenanceProduct, value: any) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const selectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customer_name: customer.name,
      customer_phone: customer.phone || '',
      customer_email: customer.email || '',
      customer_address: customer.address || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.products.length === 0) {
      toast.error(t('selectAtLeastOneProduct', { fallback: 'Please select at least one product' }));
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        assigned_worker_id: formData.assigned_worker_id || undefined
      };

      if (isEditing) {
        await api.put(`/maintenance/visits/${id}`, submitData);
        toast.success(t('maintenanceUpdated', { fallback: 'Maintenance updated successfully' }));
      } else {
        await api.post('/maintenance/visits', submitData);
        toast.success(t('maintenanceCreated', { fallback: 'Maintenance scheduled successfully' }));
      }
      
      navigate('/business/maintenance');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('failedToSave', { fallback: 'Failed to save maintenance' }));
    } finally {
      setLoading(false);
    }
  };  if 
(loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      {/* Header */}
      <div className={`flex items-center ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={() => navigate('/business/maintenance')}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 ${isRTL ? 'ml-4' : 'mr-4'}`}
          >
            <ArrowLeftIcon className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">
              {isEditing ? t('editMaintenance', { fallback: 'Edit Maintenance' }) : t('addMaintenance', { fallback: 'Add Maintenance' })}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing 
                ? t('editMaintenanceDescription', { fallback: 'Update maintenance visit details' })
                : t('addMaintenanceDescription', { fallback: 'Schedule a new maintenance visit' })
              }
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card className="border-primary-100 bg-gradient-to-br from-white to-primary-50">
          <CardHeader>
            <CardTitle className="text-primary-800 flex items-center">
              <UserIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('customerInformation', { fallback: 'Customer Information' })}
            </CardTitle>
            <CardDescription>
              {t('customerInfoDescription', { fallback: 'Enter customer details or select from existing customers' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('selectExistingCustomer', { fallback: 'Select Existing Customer' })}
              </label>
              <select
                className="w-full rounded-lg border-0 bg-white focus:ring-2 focus:ring-primary-500 transition-all duration-200 py-3"
                onChange={(e) => {
                  const customer = customers.find(c => c.id === parseInt(e.target.value));
                  if (customer) selectCustomer(customer);
                }}
              >
                <option value="">{t('selectCustomer', { fallback: 'Select a customer...' })}</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone && `- ${customer.phone}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('customerName', { fallback: 'Customer Name' })} *
                </label>
                <Input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('customerPhone', { fallback: 'Phone Number' })}
                </label>
                <Input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('customerEmail', { fallback: 'Email Address' })}
                </label>
                <Input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => handleInputChange('customer_email', e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('customerAddress', { fallback: 'Address' })}
                </label>
                <Input
                  type="text"
                  value={formData.customer_address}
                  onChange={(e) => handleInputChange('customer_address', e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>      
  {/* Products Selection */}
        <Card className="border-secondary-100 bg-gradient-to-br from-white to-secondary-50">
          <CardHeader>
            <CardTitle className="text-secondary-800 flex items-center justify-between">
              <div className="flex items-center">
                <WrenchScrewdriverIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('maintenanceProducts', { fallback: 'Maintenance Products' })}
              </div>
              <Button
                type="button"
                onClick={() => setShowProductSelector(!showProductSelector)}
                className="bg-secondary-600 hover:bg-secondary-700"
              >
                <PlusIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('addProduct', { fallback: 'Add Product' })}
              </Button>
            </CardTitle>
            <CardDescription>
              {t('productsDescription', { fallback: 'Select products that require maintenance' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Selector */}
            {showProductSelector && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">
                  {t('selectProducts', { fallback: 'Select Products' })}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {products.map(product => (
                    <div
                      key={product.id}
                      onClick={() => addProduct(product)}
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-colors duration-200"
                    >
                      <div className={`h-10 w-10 flex-shrink-0 ${isRTL ? 'ml-3' : 'mr-3'}`}>
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={getProductImageUrl(product)}
                          alt={product.name}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Products */}
            {formData.products.length > 0 ? (
              <div className="space-y-3">
                {formData.products.map((product, index) => (
                  <div key={product.product_id} className="flex items-center p-4 border border-gray-200 rounded-lg bg-white">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('productName', { fallback: 'Product' })}
                        </label>
                        <p className="text-sm text-gray-900">{product.product_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('quantity', { fallback: 'Quantity' })}
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value))}
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('notes', { fallback: 'Notes' })}
                        </label>
                        <Input
                          type="text"
                          value={product.notes}
                          onChange={(e) => updateProduct(index, 'notes', e.target.value)}
                          placeholder={t('productNotes', { fallback: 'Product-specific notes...' })}
                          className="bg-white"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className={`p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200 ${isRTL ? 'mr-4' : 'ml-4'}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <WrenchScrewdriverIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('noProductsSelected', { fallback: 'No products selected for maintenance' })}</p>
                <p className="text-sm">{t('clickAddProduct', { fallback: 'Click "Add Product" to select products' })}</p>
              </div>
            )}
          </CardContent>
        </Card> 
       {/* Schedule Information */}
        <Card className="border-green-100 bg-gradient-to-br from-white to-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <CalendarIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('scheduleInformation', { fallback: 'Schedule Information' })}
            </CardTitle>
            <CardDescription>
              {t('scheduleDescription', { fallback: 'Set the maintenance schedule and assignment details' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('scheduledDate', { fallback: 'Scheduled Date' })} *
                </label>
                <Input
                  type="date"
                  required
                  value={formData.scheduled_date}
                  onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('scheduledTime', { fallback: 'Scheduled Time' })}
                </label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => handleInputChange('scheduled_time', e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('assignedWorker', { fallback: 'Assigned Worker' })}
                </label>
                <select
                  value={formData.assigned_worker_id || ''}
                  onChange={(e) => handleInputChange('assigned_worker_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-lg border-0 bg-white focus:ring-2 focus:ring-primary-500 transition-all duration-200 py-3"
                >
                  <option value="">{t('selectWorker', { fallback: 'Select a worker...' })}</option>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name} - {worker.job_title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('priority', { fallback: 'Priority' })} *
                </label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full rounded-lg border-0 bg-white focus:ring-2 focus:ring-primary-500 transition-all duration-200 py-3"
                >
                  <option value="low">{t('lowPriority', { fallback: 'Low' })}</option>
                  <option value="medium">{t('mediumPriority', { fallback: 'Medium' })}</option>
                  <option value="high">{t('highPriority', { fallback: 'High' })}</option>
                  <option value="urgent">{t('urgentPriority', { fallback: 'Urgent' })}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('workDescription', { fallback: 'Work Description' })}
              </label>
              <textarea
                rows={3}
                value={formData.work_description}
                onChange={(e) => handleInputChange('work_description', e.target.value)}
                placeholder={t('workDescriptionPlaceholder', { fallback: 'Describe the maintenance work to be performed...' })}
                className="w-full rounded-lg border-0 bg-white focus:ring-2 focus:ring-primary-500 transition-all duration-200 py-3"
              />
            </div>
          </CardContent>
        </Card>    
    {/* Contract Information */}
        <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center">
              <ClockIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('contractInformation', { fallback: 'Contract Information' })}
            </CardTitle>
            <CardDescription>
              {t('contractDescription', { fallback: 'Set maintenance frequency and contract details' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('frequency', { fallback: 'Frequency' })} *
                </label>
                <select
                  required
                  value={formData.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  className="w-full rounded-lg border-0 bg-white focus:ring-2 focus:ring-primary-500 transition-all duration-200 py-3"
                >
                  <option value="weekly">{t('weekly', { fallback: 'Weekly' })}</option>
                  <option value="monthly">{t('monthly', { fallback: 'Monthly' })}</option>
                  <option value="quarterly">{t('quarterly', { fallback: 'Quarterly' })}</option>
                  <option value="semi_annual">{t('semiAnnual', { fallback: 'Semi-Annual' })}</option>
                  <option value="annual">{t('annual', { fallback: 'Annual' })}</option>
                  <option value="custom">{t('custom', { fallback: 'Custom' })}</option>
                </select>
              </div>
              
              {formData.frequency === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('frequencyValue', { fallback: 'Every' })}
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.frequency_value || 1}
                      onChange={(e) => handleInputChange('frequency_value', parseInt(e.target.value))}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('frequencyUnit', { fallback: 'Unit' })}
                    </label>
                    <select
                      value={formData.frequency_unit || 'months'}
                      onChange={(e) => handleInputChange('frequency_unit', e.target.value)}
                      className="w-full rounded-lg border-0 bg-white focus:ring-2 focus:ring-primary-500 transition-all duration-200 py-3"
                    >
                      <option value="days">{t('days', { fallback: 'Days' })}</option>
                      <option value="weeks">{t('weeks', { fallback: 'Weeks' })}</option>
                      <option value="months">{t('months', { fallback: 'Months' })}</option>
                      <option value="years">{t('years', { fallback: 'Years' })}</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contractValue', { fallback: 'Contract Value' })}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.contract_value}
                  onChange={(e) => handleInputChange('contract_value', parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('startDate', { fallback: 'Start Date' })}
                </label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('endDate', { fallback: 'End Date' })}
                </label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('specialInstructions', { fallback: 'Special Instructions' })}
              </label>
              <textarea
                rows={3}
                value={formData.special_instructions}
                onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                placeholder={t('specialInstructionsPlaceholder', { fallback: 'Any special instructions or requirements...' })}
                className="w-full rounded-lg border-0 bg-white focus:ring-2 focus:ring-primary-500 transition-all duration-200 py-3"
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className={`flex ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'} space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/business/maintenance')}
            disabled={loading}
          >
            {t('cancel', { fallback: 'Cancel' })}
          </Button>
          <Button
            type="submit"
            disabled={loading || formData.products.length === 0}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('saving', { fallback: 'Saving...' })}
              </div>
            ) : (
              isEditing ? t('updateMaintenance', { fallback: 'Update Maintenance' }) : t('scheduleMaintenance', { fallback: 'Schedule Maintenance' })
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}