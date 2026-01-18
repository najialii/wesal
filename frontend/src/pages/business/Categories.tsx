import { useEffect, useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import CategoryModal from '../../components/modals/CategoryModal';
import SharedBadge from '../../components/ui/SharedBadge';

interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  products_count?: number;
}

export default function Categories() {
  const { t } = useTranslation('categories');
  const { isRTL } = useDirectionClasses();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [search]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenant/categories', {
        params: { search, per_page: 50 }
      });
      setCategories(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(t('confirmDelete', { fallback: 'Are you sure you want to delete this category?' }))) {
      return;
    }

    try {
      await api.delete(`/tenant/categories/${category.id}`);
      await fetchCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || t('deleteError', { fallback: 'Failed to delete category' }));
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setEditingCategory(null);
    fetchCategories();
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      {/* Header */}
      <div className={`flex items-center ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
        <div>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">
              {t('categories')}
            </h1>
            <SharedBadge type="category" size="md" />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {t('categoryDescription', { fallback: 'Organize your products into categories. Categories are shared across all branches.' })}
          </p>
        </div>
        <button 
          onClick={handleAddCategory}
          className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transform hover:scale-[1.02] transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <PlusIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('addCategory')}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <MagnifyingGlassIcon className={`h-5 w-5 absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-4' : 'left-4'}`} />
          <input
            type="text"
            placeholder={t('searchCategories', { fallback: 'Search categories...' })}
            className={`w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} py-3 text-sm`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : categories.length > 0 ? (
          categories.map((category) => (
            <div 
              key={category.id} 
              className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-primary-300 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Header with Icon and Actions */}
              <div className={`flex items-start gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <TagIcon className="h-6 w-6 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-bold text-gray-900 truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                    {category.name}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    category.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {category.is_active ? t('active', { fallback: 'Active' }) : t('inactive', { fallback: 'Inactive' })}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className={`flex gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button 
                    onClick={() => handleEditCategory(category)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                    title={t('edit', { fallback: 'Edit' })}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(category)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title={t('delete', { fallback: 'Delete' })}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Description */}
              {category.description && (
                <p className={`text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                  {category.description}
                </p>
              )}
              
              {/* Footer with Product Count */}
              <div className={`flex items-center justify-between pt-4 border-t border-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">
                      {category.products_count || 0}
                    </span>
                  </div>
                  <span className={`text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('products', { fallback: 'products' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <TagIcon className="h-10 w-10 text-gray-400" />
            </div>
            <div className="text-gray-500">
              <h3 className="text-xl font-semibold mb-2">{t('noCategories')}</h3>
              <p className="text-sm">{t('createFirstCategory')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}