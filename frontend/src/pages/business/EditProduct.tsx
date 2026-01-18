import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, PhotoIcon, XMarkIcon, ShoppingBagIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import { getImageUrl } from '@/lib/imageUtils';

interface Category {
  id: number;
  name: string;
  is_active: boolean;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  category_id: number;
  category: { id: number; name: string } | null;
  selling_price: string | number;
  cost_price: string | number;
  stock_quantity: number;
  min_stock_level: number;
  unit: string;
  tax_rate: number;
  is_active: boolean;
  is_spare_part: boolean;
  image?: string;
  description?: string;
  barcode?: string;
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
  is_spare_part: boolean;
  image: File | null;
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
  is_spare_part: false,
  image: null,
};

export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('products');
  const { isRTL } = useDirectionClasses();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    if (id) {
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
      const product: Product = response.data;
      
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
        is_spare_part: product.is_spare_part || false,
        image: null,
      });

      if (product.image) {
        setCurrentImage(getImageUrl(product.image));
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      setError(t('failed_load_product'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
  };

  const removeCurrentImage = () => {
    setCurrentImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('sku', formData.sku);
      formDataToSend.append('category_id', formData.category_id);
      formDataToSend.append('selling_price', formData.selling_price);
      formDataToSend.append('cost_price', formData.cost_price);
      formDataToSend.append('stock_quantity', formData.stock_quantity);
      formDataToSend.append('min_stock_level', formData.min_stock_level);
      formDataToSend.append('unit', formData.unit);
      formDataToSend.append('tax_rate', formData.tax_rate);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('barcode', formData.barcode || '');
      formDataToSend.append('is_active', formData.is_active ? '1' : '0');
      formDataToSend.append('is_spare_part', formData.is_spare_part ? '1' : '0');
      formDataToSend.append('_method', 'PUT');
      
      if (formData.image) {
        console.log('Adding image to form data:', formData.image);
        formDataToSend.append('image', formData.image);
      }

      if (!currentImage) {
        console.log('Removing current image');
        formDataToSend.append('remove_image', '1');
      }

      console.log('Updating product with data:', {
        name: formData.name,
        is_spare_part: formData.is_spare_part,
        is_spare_part_string: formData.is_spare_part ? '1' : '0'
      });
      const response = await api.post(`/tenant/products/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Update response:', response.data);
      navigate('/business/products');
    } catch (err: any) {
      console.error('Failed to update product:', err);
      setError(err.response?.data?.message || t('failed_update_product'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className={`flex items-center mb-4 ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
            <button
              onClick={() => navigate('/business/products')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors shadow-sm"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('edit_product')}</h1>
              <p className="mt-2 text-sm text-gray-600">
                {t('update_product_info')}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-8">
            {error && (
              <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Image Upload */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Image</h3>
                  <div className="space-y-4">
                    {/* Image Preview */}
                    <div className="aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
                      {imagePreview ? (
                        <>
                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </>
                      ) : currentImage ? (
                        <>
                          <img
                            src={currentImage}
                            alt="Current product"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeCurrentImage}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center">
                          <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No image selected</p>
                        </div>
                      )}
                    </div>

                    {/* Upload Button */}
                    <div>
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="image"
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <PhotoIcon className="w-4 h-4 mr-2" />
                        {imagePreview || currentImage ? 'Change Image' : 'Upload Image'}
                      </label>
                      <p className="mt-2 text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Form Fields */}
              <div className="lg:col-span-2 space-y-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter product name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SKU <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="e.g., PRD-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                      <input
                        type="text"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Optional barcode"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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

                {/* Product Type */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    Product Type
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Choose whether this is a regular product for sale or a spare part for maintenance.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        !formData.is_spare_part 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="product_type"
                          checked={!formData.is_spare_part}
                          onChange={() => setFormData({ ...formData, is_spare_part: false })}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            !formData.is_spare_part 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            <ShoppingBagIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Regular Product</div>
                            <div className="text-sm text-gray-500">For sale to customers</div>
                          </div>
                        </div>
                      </label>

                      <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.is_spare_part 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="product_type"
                          checked={formData.is_spare_part}
                          onChange={() => setFormData({ ...formData, is_spare_part: true })}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            formData.is_spare_part 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            <WrenchScrewdriverIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Spare Part</div>
                            <div className="text-sm text-gray-500">For maintenance services</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    Pricing & Tax
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cost Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={formData.cost_price}
                          onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selling Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={formData.selling_price}
                          onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.tax_rate}
                        onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="15"
                      />
                    </div>
                  </div>
                </div>

                {/* Inventory */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    Inventory Management
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Stock Level <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.min_stock_level}
                        onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="5"
                      />
                      <p className="mt-1 text-xs text-gray-500">Alert when stock falls below this level</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    Additional Details
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        placeholder="Enter product description, features, specifications..."
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Product is active and available for sale</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-8 mt-8 space-x-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/business/products')}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {saving && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {saving ? 'Updating Product...' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}