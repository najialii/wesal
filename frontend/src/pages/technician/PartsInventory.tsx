import { useEffect, useState } from 'react';
import { Package, Search, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { technicianService } from '@/services/technician';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { useTranslation, useDirectionClasses } from '@/lib/translation';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  sku: string;
  selling_price: number;
  stock_quantity: number;
  min_stock_level: number;
  category?: {
    name: string;
  };
}

export default function PartsInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation('technician');
  const { isRTL } = useDirectionClasses();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await technicianService.getProducts();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error(t('messages.failed_to_load'));
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLowStock = (product: Product) => {
    return product.stock_quantity <= product.min_stock_level;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h1">{t('parts.title')}</h1>
        <p className="text-caption">{t('parts.subtitle')}</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
            <Input
              placeholder={t('parts.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={isRTL ? 'pr-10' : 'pl-10'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className={isLowStock(product) ? 'border-orange-200 bg-orange-50/30' : ''}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* Header */}
                  <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                      {product.category && (
                        <p className="text-xs text-gray-500 mt-1">{product.category.name}</p>
                      )}
                    </div>
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* Stock Level */}
                  <div className="space-y-2">
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm text-gray-600">{t('parts.stock_level')}</span>
                      <span className={`text-sm font-semibold ${
                        isLowStock(product) ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {product.stock_quantity} {t('parts.units')}
                      </span>
                    </div>
                    
                    {/* Stock Bar */}
                    <div className={`w-full bg-gray-200 rounded-full h-2 ${isRTL ? 'transform rotate-180' : ''}`}>
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isLowStock(product) ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (product.stock_quantity / (product.min_stock_level * 2)) * 100)}%`
                        }}
                      />
                    </div>

                    {isLowStock(product) && (
                      <div className={`flex items-center gap-2 text-orange-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">{t('parts.low_stock')}</span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm text-gray-600">{t('parts.unit_price')}</span>
                      <span className="text-lg font-semibold text-gray-900">
                        <CurrencyDisplay amount={product.selling_price} />
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={t('parts.no_parts')}
          description={searchQuery ? t('parts.adjust_search') : t('parts.no_parts_description')}
        />
      )}
    </div>
  );
}
