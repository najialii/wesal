import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, CubeIcon, ShoppingBagIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import { formatCurrency } from '@/lib/currency';
import { getProductImageUrl } from '@/lib/imageUtils';
import { Pagination } from '@/components/ui/Pagination';
import { useBranch } from '@/contexts/BranchContext';

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

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function Products() {
  const navigate = useNavigate();
  const { t } = useTranslation('products');
  const { isRTL } = useDirectionClasses();
  const { currentBranch } = useBranch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'regular' | 'spare'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
  });

  // Fetch products when branch changes
  useEffect(() => {
    if (currentBranch?.id) {
      setCurrentPage(1);
      fetchProducts();
    }
  }, [currentBranch?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, productTypeFilter]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, itemsPerPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = { 
        search, 
        per_page: itemsPerPage,
        page: currentPage,
      };
      
      // Pass current branch ID to filter products
      if (currentBranch?.id) {
        params.branch_id = currentBranch.id;
      }
      
      if (productTypeFilter === 'regular') {
        params.is_spare_part = 0;
      } else if (productTypeFilter === 'spare') {
        params.is_spare_part = 1;
      }
      
      const response = await api.get('/tenant/products', { params });
      const data = response.data;
      
      // Handle both paginated and non-paginated responses
      if (data.data && Array.isArray(data.data)) {
        setProducts(data.data);
        setPaginationMeta({
          current_page: data.current_page || 1,
          last_page: data.last_page || 1,
          per_page: data.per_page || itemsPerPage,
          total: data.total || data.data.length,
        });
      } else {
        setProducts(Array.isArray(data) ? data : []);
        setPaginationMeta({
          current_page: 1,
          last_page: 1,
          per_page: itemsPerPage,
          total: Array.isArray(data) ? data.length : 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(t('delete_confirmation', { interpolation: { name: product.name } }))) return;

    try {
      await api.delete(`/tenant/products/${product.id}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || t('error_message', { fallback: 'An error occurred' }));
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity <= 0) {
      return { text: t('out_of_stock'), color: 'text-red-600 bg-red-100' };
    } else if (product.stock_quantity <= product.min_stock_level) {
      return { text: t('low_stock'), color: 'text-yellow-600 bg-yellow-100' };
    } else {
      return { text: t('in_stock'), color: 'text-green-600 bg-green-100' };
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      {/* Header */}
      
      <div className={`flex items-center ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('subtitle', { fallback: 'Manage your inventory and product catalog' })}
          </p>
        </div>
        <button 
          onClick={() => navigate('/business/products/add')}
          className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transform hover:scale-[1.02] transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <PlusIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('add_product')}
        </button>
      </div>

         <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl font-bold text-gray-900">{products.length}</div>
          <div className="text-sm text-gray-500">{t('total_products', { fallback: 'Total Products' })}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-2">
            <ShoppingBagIcon className="w-5 h-5 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">
              {products.filter(p => !p.is_spare_part).length}
            </div>
          </div>
          <div className="text-sm text-gray-500">{t('regular_product')}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-2">
            <WrenchScrewdriverIcon className="w-5 h-5 text-orange-600" />
            <div className="text-2xl font-bold text-orange-600">
              {products.filter(p => p.is_spare_part).length}
            </div>
          </div>
          <div className="text-sm text-gray-500">{t('spare_part')}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl font-bold text-yellow-600">
            {products.filter(p => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0).length}
          </div>
          <div className="text-sm text-gray-500">{t('low_stock')}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl font-bold text-red-600">
            {products.filter(p => p.stock_quantity <= 0).length}
          </div>
          <div className="text-sm text-gray-500">{t('out_of_stock')}</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className={`flex flex-col sm:flex-row gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          {/* Product Type Filters */}
          <div className={`flex flex-wrap gap-2 ${isRTL ? 'sm:order-1' : 'sm:order-2'}`}>
            <button
              onClick={() => setProductTypeFilter('all')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                productTypeFilter === 'all'
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-200 scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
              }`}
            >
              {t('all_products', { fallback: 'All Products' })}
            </button>
            <button
              onClick={() => setProductTypeFilter('regular')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                productTypeFilter === 'regular'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
              }`}
            >
              <ShoppingBagIcon className="w-4 h-4" />
              <span>{t('regular_product')}</span>
            </button>
            <button
              onClick={() => setProductTypeFilter('spare')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                productTypeFilter === 'spare'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-200 scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
              }`}
            >
              <WrenchScrewdriverIcon className="w-4 h-4" />
              <span>{t('spare_part')}</span>
            </button>
          </div>
          
          {/* Search */}
          <div className={`relative flex-1 ${isRTL ? 'sm:order-2' : 'sm:order-1'}`}>
            <MagnifyingGlassIcon className={`h-5 w-5 absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-4' : 'left-4'}`} />
            <input
              type="text"
              placeholder={t('search_products')}
              className={`w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} py-3 text-sm`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t('product_name')}</th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t('product_type')}</th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t('category')}</th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t('price')}</th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t('stock')}</th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t('status')}</th>
                  <th className={`px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {products.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`h-12 w-12 flex-shrink-0 ${isRTL ? 'ml-4' : 'mr-4'}`}>
                            <img
                              className="h-12 w-12 rounded-xl object-cover border-2 border-gray-100"
                              src={getProductImageUrl(product)}
                              alt={product.name}
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&size=48&background=f3f4f6&color=6b7280&format=png`;
                              }}
                            />
                          </div>
                          <div>
                            <div 
                              className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight max-w-xs" 
                              title={product.name}
                            >
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 font-mono">SKU: {product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRTL ? 'ml-2' : 'mr-2'} ${
                            product.is_spare_part 
                              ? 'bg-orange-100 text-orange-600' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {product.is_spare_part ? (
                              <WrenchScrewdriverIcon className="w-4 h-4" />
                            ) : (
                              <ShoppingBagIcon className="w-4 h-4" />
                            )}
                          </div>
                          <span className={`text-xs font-medium ${
                            product.is_spare_part 
                              ? 'text-orange-700' 
                              : 'text-blue-700'
                          }`}>
                            {product.is_spare_part ? t('spare_part') : t('regular_product')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {product.category?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{formatCurrency(Number(product.selling_price))}</div>
                        <div className="text-sm text-gray-500">{t('cost_price')}: {formatCurrency(Number(product.cost_price))}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{product.stock_quantity} {product.unit}</div>
                        <div className="text-sm text-gray-500">{t('min_stock')}: {product.min_stock_level}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                        <button 
                          onClick={() => navigate(`/business/products/edit/${product.id}`)} 
                          className="text-primary-600 hover:text-primary-900 p-2 rounded-lg hover:bg-primary-50 transition-colors duration-200"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product)} 
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {products.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CubeIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-500">{t('no_products')}</h3>
                <p className="mt-1 text-gray-400">{t('get_started', { fallback: 'Get started by adding your first product.' })}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Pagination */}
        {!loading && products.length > 0 && (
          <Pagination
            currentPage={paginationMeta.current_page}
            totalPages={paginationMeta.last_page}
            totalItems={paginationMeta.total}
            itemsPerPage={paginationMeta.per_page}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(perPage) => {
              setItemsPerPage(perPage);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* Stats */}
   
    </div>
  );
}