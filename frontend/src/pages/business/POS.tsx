import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  MinusIcon, 
  TrashIcon,
  CreditCardIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  UserIcon,
  PhoneIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { getProductImageUrl } from '@/lib/imageUtils';
import { ProductGridSkeleton } from '@/components/ui/ProductCardSkeleton';
import api from '../../lib/api';
import ReceiptModal from '../../components/modals/ReceiptModal';
import { useBranch } from '../../contexts/BranchContext';

interface Product {
  id: number;
  name: string;
  sku: string;
  selling_price: string | number;
  stock_quantity: number;
  unit: string;
  tax_rate: string | number;
  image?: string;
}

interface CartItem extends Product {
  quantity: number;
  total: number;
  selling_price: number;
  tax_rate: number;
  image?: string;
}

export default function POS() {
  const { t } = useTranslation('pos');
  const { isRTL } = useDirectionClasses();
  const { currentBranch } = useBranch();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Fetch products when branch changes
  useEffect(() => {
    if (currentBranch?.id) {
      setCart([]); // Clear cart when branch changes
      fetchProducts();
    }
  }, [currentBranch?.id]);

  // Fetch products when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const params: any = { search };
      
      // Pass current branch ID to filter products
      if (currentBranch?.id) {
        params.branch_id = currentBranch.id;
      }
      
      const response = await api.get('/pos/products', { params });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    // Check if product has sufficient stock
    if (product.stock_quantity <= 0) {
      alert(t('outOfStock'));
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // Check if adding one more would exceed stock
      if (existingItem.quantity >= product.stock_quantity) {
        alert(t('insufficientStock'));
        return;
      }
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const sellingPrice = Number(product.selling_price);
      const taxRate = Number(product.tax_rate);
      const cartItem: CartItem = {
        ...product,
        selling_price: sellingPrice,
        tax_rate: taxRate,
        quantity: 1,
        total: sellingPrice * (1 + taxRate / 100)
      };
      setCart([...cart, cartItem]);
    }
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Check stock availability
    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock_quantity) {
      alert(t('insufficientStock'));
      return;
    }

    setCart(cart.map(item => 
      item.id === productId 
        ? { 
            ...item, 
            quantity: newQuantity,
            total: Number(item.selling_price) * newQuantity * (1 + Number(item.tax_rate) / 100)
          }
        : item
    ));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.selling_price) * item.quantity), 0);
    const tax = cart.reduce((sum, item) => sum + (Number(item.selling_price) * item.quantity * Number(item.tax_rate) / 100), 0);
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  const processSale = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      const totals = getCartTotals();
      
      const saleData = {
        customer_name: customerName || t('walkInCustomer'),
        customer_phone: customerPhone,
        payment_method: paymentMethod,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        branch_id: currentBranch?.id,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: Number(item.selling_price),
          discount_amount: 0
        }))
      };

      const response = await api.post('/pos/sales', saleData);
      
      // Store completed sale and show receipt modal
      setCompletedSale(response.data.sale);
      setShowReceipt(true);
      
      // Clear cart and customer info
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      
    } catch (error: any) {
      alert(error.response?.data?.message || t('failedToProcess'));
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, total } = getCartTotals();

  return (
    <>
      {showReceipt && completedSale && (
        <ReceiptModal
          sale={completedSale}
          onClose={() => {
            setShowReceipt(false);
            setCompletedSale(null);
          }}
        />
      )}
      
      <div className="-m-6 h-[calc(100vh-4rem)] bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex h-full">
        {/* Products Section */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <div className="bg-white shadow-sm border-b px-8 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {t('pos')}
                </h1>
                <p className="text-gray-400 mt-1">{t('selectProducts')}</p>
              </div>
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                {/* Current Branch Display */}
                {currentBranch && (
                  <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                    <BuildingStorefrontIcon className="h-5 w-5 text-blue-400" />
                    <span className="text-blue-700 font-medium">{currentBranch.name}</span>
                  </div>
                )}
                <div className="bg-primary-50 px-4 py-2 rounded-full">
                  {productsLoading ? (
                    <div className="h-5 w-16 bg-gray-300 rounded animate-pulse" />
                  ) : (
                    <span className="text-primary-700 font-medium">{products.length} {t('products')}</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="mt-6 relative max-w-md">
              <MagnifyingGlassIcon className={`h-5 w-5 absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 ${productsLoading ? 'text-primary-500 animate-pulse' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder={t('searchProducts')}
                className={`${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 w-full rounded-xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all duration-200 ${productsLoading ? 'opacity-75' : ''}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={productsLoading}
              />
              {productsLoading && (
                <div className="absolute inset-0 rounded-xl bg-white/50 flex items-center justify-center pointer-events-none">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-8">
            {productsLoading ? (
              <ProductGridSkeleton count={12} />
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <ShoppingCartIcon className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg">{t('noProductsFound')}</p>
                <p className="text-sm">{t('adjustSearchTerms')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  const cartItem = cart.find(item => item.id === product.id);
                  const isInCart = !!cartItem;
                  
                  return (
                    <div key={product.id} className="group relative flex flex-col h-full">
                      {/* Product Image */}
                      <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-200 relative shadow-md hover:shadow-xl transition-shadow duration-300">
                        <img
                          src={getProductImageUrl(product)}
                          alt={product.name}
                          className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&size=500&background=f3f4f6&color=6b7280&format=svg`;
                          }}
                        />
                        
                        {/* Stock Status Badge */}
                        <div className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'}`}>
                          {product.stock_quantity <= 5 ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                              {t('lowStock')}
                            </span>
                          ) : product.stock_quantity <= 20 ? (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                              {t('limited')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              {t('inStock')}
                            </span>
                          )}
                        </div>

                        {/* Quantity Badge for items in cart */}
                        {isInCart && (
                          <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'}`}>
                            <span className="inline-flex items-center rounded-full bg-primary-400 px-2.5 py-0.5 text-xs font-medium text-white">
                              {cartItem.quantity} {t('inCart')}
                            </span>
                          </div>
                        )}

                        {/* Clickable overlay - only when not in cart */}
                        {!isInCart && (
                          <div 
                            className="absolute inset-0 cursor-pointer"
                            onClick={() => addToCart(product)}
                          >
                            <span aria-hidden="true" className="absolute inset-0"></span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className={`mt-4 flex ${isRTL ? 'flex-row-reverse' : 'justify-between'} items-start`}>
                        <div className={`flex-1 ${isRTL ? 'pl-3' : 'pr-3'}`}>
                          <h3 
                            className="text-base text-gray-900 font-semibold line-clamp-2 leading-tight h-12" 
                            title={product.name}
                          >
                            {product.name}
                          </h3>
                          <p className="mt-1.5 text-xs text-gray-500 font-mono">
                            SKU: {product.sku}
                          </p>
                          <p className="mt-1 text-xs text-gray-400 font-medium">
                            {product.stock_quantity} {product.unit} {t('available')}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-primary-400 whitespace-nowrap">
                          <CurrencyDisplay amount={Number(product.selling_price)} />
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex-grow flex flex-col justify-end">
                        {!isInCart ? (
                          <button
                            onClick={() => addToCart(product)}
                            className="w-full flex items-center justify-center rounded-lg border border-transparent bg-primary-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <PlusIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('addToCart')}
                          </button>
                        ) : (
                          <div className="space-y-2">
                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between rounded-lg border-2 border-primary-200 bg-white shadow-sm">
                              <button
                                onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                                className={`flex items-center justify-center px-4 py-2.5 text-gray-400 hover:text-gray-800 hover:bg-gray-50 ${isRTL ? 'rounded-r-lg' : 'rounded-l-lg'} transition-colors duration-200`}
                              >
                                <MinusIcon className="h-5 w-5" />
                              </button>
                              <div className="flex-1 text-center py-2.5">
                                <span className="text-base font-bold text-gray-900">{cartItem.quantity}</span>
                              </div>
                              <button
                                onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                                className={`flex items-center justify-center px-4 py-2.5 text-primary-400 hover:text-primary-800 hover:bg-primary-50 ${isRTL ? 'rounded-l-lg' : 'rounded-r-lg'} transition-colors duration-200`}
                              >
                                <PlusIcon className="h-5 w-5" />
                              </button>
                            </div>
                            
                            {/* Remove from Cart */}
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="w-full flex items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                            >
                              <TrashIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {t('remove')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modern Cart Section */}
        <div className={`w-96 flex-shrink-0 bg-white shadow-2xl flex flex-col ${isRTL ? 'border-r' : 'border-l'} border-gray-200`} dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Cart Header */}
          <div className="px-6 py-4 border-b border-gray-100 ">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{t('currentSale')}</h2>
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                <div className="bg-primary-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {cart.length}
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                  >
                    {t('clearAll')}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Customer Info */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('customer')}</h3>
            <div className="space-y-3">
              <div className="relative">
                <UserIcon className={`h-4 w-4 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`} />
                <input
                  type="text"
                  placeholder={t('customerName')}
                  className={`${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2.5 w-full text-sm rounded-lg border-0 bg-white focus:ring-2 focus:ring-primary-500 transition-all duration-200`}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="relative">
                <PhoneIcon className={`h-4 w-4 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`} />
                <input
                  type="text"
                  placeholder={t('customerPhone')}
                  className={`${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2.5 w-full text-sm rounded-lg border-0 bg-white focus:ring-2 focus:ring-primary-500 transition-all duration-200`}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <ShoppingCartIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-400">{t('cartEmpty')}</p>
                <p className="text-xs text-gray-500 text-center mt-1">{t('addProductsToStart')}</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow duration-200">
                    <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                      {/* Product Image */}
                      <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <img
                          className="w-full h-full object-cover"
                          src={item.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&size=48&background=f8fafc&color=64748b&format=svg`}
                          alt={item.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&size=48&background=f8fafc&color=64748b&format=svg`;
                          }}
                        />
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <CurrencyDisplay amount={Number(item.selling_price)} showIcon={false} /> {t('each')}
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className={`p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 ${isRTL ? 'rounded-r-lg' : 'rounded-l-lg'} transition-colors duration-200`}
                            >
                              <MinusIcon className="h-3 w-3" />
                            </button>
                            <span className="px-3 py-1.5 text-xs font-semibold text-gray-900 min-w-[2.5rem] text-center bg-white border-x border-gray-200">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className={`p-1.5 text-primary-400 hover:text-primary-700 hover:bg-primary-50 ${isRTL ? 'rounded-l-lg' : 'rounded-r-lg'} transition-colors duration-200`}
                            >
                              <PlusIcon className="h-3 w-3" />
                            </button>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-red-400 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                        
                        {/* Item Total */}
                        <div className={`mt-2 ${isRTL ? 'text-left' : 'text-right'}`}>
                          <CurrencyDisplay amount={item.total} className="text-sm font-bold text-primary-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200 bg-white">
              {/* Totals */}
              <div className="px-6 py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('subtotal')}:</span>
                  <CurrencyDisplay amount={subtotal} className="font-medium" showIcon={false} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('tax')} (15%):</span>
                  <CurrencyDisplay amount={tax} className="font-medium" showIcon={false} />
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>{t('total')}:</span>
                  <CurrencyDisplay amount={total} className="text-primary-400" />
                </div>
              </div>

              {/* Payment Method */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {t('paymentMethod')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-center justify-center p-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                      paymentMethod === 'cash'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-white text-gray-700'
                    }`}
                  >
                    <BanknotesIcon className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                    {t('cash')}
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-center p-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                      paymentMethod === 'card'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-white text-gray-700'
                    }`}
                  >
                    <CreditCardIcon className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                    {t('card')}
                  </button>
                </div>
              </div>

              {/* Process Sale Button */}
              <div className="p-6">
                <button
                  onClick={processSale}
                  disabled={cart.length === 0 || loading}
                  className="w-full bg-gradient-to-r from-primary-400 to-primary-700 text-white py-3 px-4 rounded-xl font-bold hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('processing')}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span>{t('completeSale')}</span>
                      <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm opacity-90`}>
                        <CurrencyDisplay amount={total} showIcon={false} />
                      </span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}