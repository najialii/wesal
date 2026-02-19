import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PhotoIcon, XMarkIcon, ShoppingBagIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import { useBranch } from '../../contexts/BranchContext';

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

export default function AddProduct() {
  const navigate = useNavigate();
  const { t } = useTranslation('products');
  const { isRTL } = useDirectionClasses();
  const { currentBranch } = useBranch();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/tenant/categories-active');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentBranch?.id) {
      setError(t('no_branch_selected', { fallback: 'No branch selected. Please select a branch first.' }));
      return;
    }

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
      
      // Pass the current branch ID from context
      formDataToSend.append('branch_ids[0]', currentBranch.id.toString());
      formDataToSend.append(`branch_stock[${currentBranch.id}]`, formData.stock_quantity);
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      await api.post('/tenant/products', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/business/products');
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setError(err.response?.data?.message || t('failed_save_product'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className={`flex items-center mb-4 ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
            <button
              onClick={() => navigate('/business/products')}
              className="p-2 text-gray-400 hover:text-gray-400 hover:bg-white rounded-lg transition-colors shadow-sm"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('add_new_product')}</h1>
              <p className="mt-2 text-sm text-gray-400">
                {t('create_new_product')}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-">
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
              <div className="lg:col-span-1 ">
                <div className="sticky top-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('product_image')}</h3>
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
                            className={`absolute top-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-400 transition-colors ${isRTL ? 'left-2' : 'right-2'}`}
                          >
                            <XMarkIcon className="w-4 h-4 text-center" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center">
                          <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">{t('no_image_selected')}</p>
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
                        className={`w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <PhotoIcon className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {imagePreview ? t('change_image') : t('upload_image')}
                      </label>
                      <p className="mt-2 text-xs text-gray-500">
                        {t('image_format_info')}
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
                    {t('basic_information')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('product_name')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder={t('enter_product_name')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('sku')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="e.g., PRD-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('category')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      >
                        <option value="">{t('select_category')}</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('barcode')}</label>
                      <input
                        type="text"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder={t('optional_barcode')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('unit')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      >
                        <option value="pcs">{t('pieces')}</option>
                        <option value="kg">{t('kilograms')}</option>
                        <option value="ltr">{t('liters')}</option>
                        <option value="box">{t('box')}</option>
                        <option value="pack">{t('pack')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Product Type */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    {t('product_type')}
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400 mb-4">
                      {t('product_type_description')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        !formData.is_spare_part 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="product_type"
                          checked={!formData.is_spare_part}
                          onChange={() => setFormData({ ...formData, is_spare_part: false })}
                          className="sr-only"
                        />
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            !formData.is_spare_part 
                              ? 'bg-primary-500 text-white' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            <ShoppingBagIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{t('regular_product')}</div>
                            <div className="text-sm text-gray-500">{t('regular_product_desc')}</div>
                          </div>
                        </div>
                      </label>

                      <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.is_spare_part 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="product_type"
                          checked={formData.is_spare_part}
                          onChange={() => setFormData({ ...formData, is_spare_part: true })}
                          className="sr-only"
                        />
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            formData.is_spare_part 
                              ? 'bg-primary-500 text-white' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            <WrenchScrewdriverIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{t('spare_part')}</div>
                            <div className="text-sm text-gray-500">{t('spare_part_desc')}</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    {t('pricing_tax')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('cost_price')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <img src="/currancy.svg" alt="SAR" className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={formData.cost_price}
                          onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                          className={`w-full py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${isRTL ? 'pr-8 pl-4' : 'pl-8 pr-4'}`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('selling_price')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <img src="/currancy.svg" alt="SAR" className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={formData.selling_price}
                          onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                          className={`w-full py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${isRTL ? 'pr-8 pl-4' : 'pl-8 pr-4'}`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('tax_rate')} (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.tax_rate}
                        onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="15"
                      />
                    </div>
                  </div>
                </div>

                {/* Inventory */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    {t('inventory_management')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('stock_quantity')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('min_stock_level')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.min_stock_level}
                        onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="5"
                      />
                      <p className="mt-1 text-xs text-gray-500">{t('alert_stock_below')}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    {t('additional_details')}
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('description')}</label>
                      <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                        placeholder={t('enter_description')}
                      />
                    </div>

                    <div>
                      <label className={`flex items-center ${isRTL ? 'flex-row-reverse justify-end space-x-reverse space-x-3' : 'space-x-3'}`}>
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="w-4 h-4 text-primary-400 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{t('product_active_sale')}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex pt-8 mt-8 border-t border-gray-200 ${isRTL ? 'justify-start space-x-reverse space-x-4' : 'justify-end space-x-4'}`}>
              <button
                type="button"
                onClick={() => navigate('/business/products')}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                {t('cancel')}
              </button>
              <Button
                type="submit"
                disabled={saving}
                className="px-6 py-3"
              >
                {saving ? t('creating_product') : t('create_product')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}