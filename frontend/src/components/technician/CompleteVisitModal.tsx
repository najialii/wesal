import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { technicianService } from '@/services/technician';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  sku: string;
  selling_price: number;
  stock_quantity: number;
}

interface SelectedProduct {
  product_id: number;
  quantity: number;
  product?: Product;
}

interface CompleteVisitModalProps {
  visitId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CompleteVisitModal({ visitId, onClose, onSuccess }: CompleteVisitModalProps) {
  const [completionNotes, setCompletionNotes] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const data = await technicianService.getProducts();
      setProducts(data.products);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddProduct = (product: Product) => {
    if (selectedProducts.find(p => p.product_id === product.id)) {
      toast.error('Product already added');
      return;
    }

    setSelectedProducts([
      ...selectedProducts,
      { product_id: product.id, quantity: 1, product }
    ]);
    setSearchQuery('');
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.product_id !== productId));
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    setSelectedProducts(selectedProducts.map(p =>
      p.product_id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
    ));
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => {
      const product = products.find(p => p.id === item.product_id);
      return total + (product?.selling_price || 0) * item.quantity;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!completionNotes.trim()) {
      toast.error('Please enter completion notes');
      return;
    }

    if (completionNotes.trim().length < 10) {
      toast.error('Completion notes must be at least 10 characters');
      return;
    }

    try {
      setLoading(true);
      await technicianService.completeVisit(visitId, {
        completion_notes: completionNotes,
        products: selectedProducts.length > 0 ? selectedProducts.map(p => ({
          product_id: p.product_id,
          quantity: p.quantity
        })) : undefined
      });
      onSuccess();
    } catch (error: any) {
      console.error('Failed to complete visit:', error);
      toast.error(error.response?.data?.message || 'Failed to complete visit');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Complete Visit</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Completion Notes */}
            <div>
              <Label htmlFor="notes">Completion Notes *</Label>
              <Textarea
                id="notes"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Describe the work completed, any issues found, and recommendations..."
                rows={4}
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                Minimum 10 characters
              </p>
            </div>

            {/* Parts Used */}
            <div>
              <Label>Parts Used (Optional)</Label>
              
              {/* Selected Products */}
              {selectedProducts.length > 0 && (
                <div className="mt-2 space-y-2">
                  {selectedProducts.map((item) => {
                    const product = products.find(p => p.id === item.product_id);
                    if (!product) return null;

                    return (
                      <div key={item.product_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max={product.stock_quantity}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value))}
                            className="w-20"
                          />
                          <span className="text-sm font-medium text-gray-900 w-24 text-right">
                            <CurrencyDisplay amount={product.selling_price * item.quantity} />
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(item.product_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Total */}
                  <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                    <span className="font-semibold text-gray-900">Total Cost</span>
                    <span className="font-semibold text-lg text-gray-900">
                      <CurrencyDisplay amount={calculateTotal()} />
                    </span>
                  </div>
                </div>
              )}

              {/* Add Product */}
              <div className="mt-3">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search products to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                      {loadingProducts ? (
                        <div className="p-4 text-center text-gray-600">Loading...</div>
                      ) : filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleAddProduct(product)}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
                            disabled={selectedProducts.some(p => p.product_id === product.id)}
                          >
                            <div>
                              <p className="font-medium text-sm text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-600">
                                SKU: {product.sku} | Stock: {product.stock_quantity}
                              </p>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              <CurrencyDisplay amount={product.selling_price} />
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-600">No products found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !completionNotes.trim()}
            >
              {loading ? 'Completing...' : 'Complete Visit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
