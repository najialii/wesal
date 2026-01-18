import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';

interface Category {
  id: number;
  name: string;
  is_active: boolean;
}

interface ProductFormData {
  name: string;
  sku: string;
  category_id: string;
  selling_price: string;
  cost_price: string;
  stock_quantity: string;
  min_stock_level: string;
  unit: string;
  tax_rate: string;
  description: string;
  barcode: string;
  is_active: boolean;
}

const initialFormData: ProductFormData = {
  name: '',
  sku: '',
  category_id: '',
  selling_price: '',
  cost_price: '',
  stock_quantity: '0',
  min_stock_level: '5',
  unit: 'pcs',
  tax_rate: '15',
  description: '',
  barcode: '',
  is_active: true,
};

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/tenant/categories-active');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tenant/products/${id}`);
      const product = response.data.data || response.data;
      setFormData({
        name: product.name,
        sku: product.sku,
        category_id: String(product.category_id),
        selling_price: String(product.selling_price),
        cost_price: String(product.cost_price),
        stock_quantity: String(product.stock_quantity),
        min_stock_level: String(product.min_stock_level),
        unit: product.unit,
        tax_rate: String(product.tax_rate),
        description: product.description || '',
        barcode: product.barcode || '',
        is_active: product.is_active,
      });
    } catch (error) {
      console.error('Failed to fetch product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        category_id: parseInt(formData.category_id),
        selling_price: parseFloat(formData.selling_price),
        cost_price: parseFloat(formData.cost_price),
        stock_quantity: parseInt(formData.stock_quantity),
        min_stock_level: parseInt(formData.min_stock_level),
        unit: formData.unit,
        tax_rate: parseFloat(formData.tax_rate),
        description: formData.description || null,
        barcode: formData.barcode || null,
        is_active: formData.is_active,
      };

      if (isEditing) {
        await api.put(`/tenant/products/${id}`, payload);
      } else {
        await api.post('/tenant/products', payload);
      }

      navigate('/business/products');
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/business/products')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Products
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEditing ? 'Update product details' : 'Fill in the product information below'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., PRD-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 bg-white"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input
                type="text"
                placeholder="Optional barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 bg-white"
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="ltr">Liters</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="15"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                  className="w-full pl-4 pr-8 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Stock Level <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="5"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
              <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={4}
                placeholder="Enter product description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Product is active and available for sale
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/business/products')}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {saving ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
