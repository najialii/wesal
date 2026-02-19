import { PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../lib/translation';

interface SaleItem {
  product: {
    name: string;
    sku: string;
  };
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface Sale {
  id: number;
  sale_number: string;
  customer_name: string;
  customer_phone?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  sale_date: string;
  items: SaleItem[];
  tenant?: {
    name: string;
  };
}

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
}

export default function ReceiptModal({ sale, onClose }: ReceiptModalProps) {
  const { t } = useTranslation('pos');

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Modal Overlay - Hidden when printing */}
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{ display: 'block' }}>
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #receipt-print-area,
            #receipt-print-area * {
              visibility: visible;
            }
            #receipt-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
        
        <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {t('saleCompleted', { fallback: 'Sale Completed!' })}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-3">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {t('saleNumber', { fallback: 'Invoice' })} <span className="font-bold text-gray-900">#{sale.sale_number}</span>
            </p>
            <p className="text-3xl font-bold text-green-600">
              ${Number(sale.total_amount).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(sale.sale_date).toLocaleString()}
            </p>
          </div>

          {/* Invoice Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            {/* Customer Info */}
            {sale.customer_name && !sale.customer_name.toLowerCase().includes('walk') && (
              <div className="border-b border-gray-200 pb-3">
                <p className="text-xs text-gray-500 mb-1">Customer</p>
                <p className="font-semibold text-gray-900">{sale.customer_name}</p>
                {sale.customer_phone && (
                  <p className="text-sm text-gray-600">{sale.customer_phone}</p>
                )}
              </div>
            )}

            {/* Items */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Items ({sale.items.length})</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sale.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} × ${Number(item.unit_price).toFixed(2)}</p>
                    </div>
                    <p className="font-semibold text-gray-900">${Number(item.total_amount).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${Number(sale.subtotal).toFixed(2)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-${Number(sale.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>VAT (15%)</span>
                <span>${Number(sale.tax_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-300 pt-2 mt-2">
                <span>Total</span>
                <span>${Number(sale.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-semibold text-gray-900 uppercase">{sale.payment_method}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              {t('printReceipt', { fallback: 'Print Receipt' })}
            </button>
            
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('close', { fallback: 'Close' })}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt - Only visible when printing */}
      <div id="receipt-print-area" style={{ display: 'none' }}>
        <style>{`
          @media print {
            #receipt-print-area {
              display: block !important;
            }
          }
        `}</style>
        <div className="max-w-[80mm] mx-auto bg-white p-4 font-mono text-sm">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-800 pb-3 mb-3">
            <h1 className="text-xl font-bold uppercase tracking-wide">{sale.tenant?.name || 'Your Store'}</h1>
            <p className="text-xs mt-1">TAX INVOICE / فاتورة ضريبية</p>
            <p className="text-xs mt-1">VAT No: 300000000000003</p>
          </div>

          {/* Sale Info */}
          <div className="text-xs mb-3 space-y-0.5">
            <div className="flex justify-between">
              <span>Invoice:</span>
              <span className="font-bold">{sale.sale_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(sale.sale_date).toLocaleString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            {sale.customer_name && !sale.customer_name.toLowerCase().includes('walk') && !sale.customer_name.includes('عادي') && (
              <>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-semibold">{sale.customer_name}</span>
                </div>
                {sale.customer_phone && (
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span>{sale.customer_phone}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Items */}
          <div className="border-t border-b border-gray-800 py-2 mb-2">
            <div className="flex text-xs font-bold mb-1">
              <div className="flex-1">ITEM</div>
              <div className="w-12 text-center">QTY</div>
              <div className="w-16 text-right">PRICE</div>
              <div className="w-20 text-right">TOTAL</div>
            </div>
            {sale.items.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="flex text-xs">
                  <div className="flex-1">
                    <div className="font-semibold">{item.product.name}</div>
                    <div className="text-[10px] text-gray-600">{item.product.sku}</div>
                  </div>
                  <div className="w-12 text-center">{item.quantity}</div>
                  <div className="w-16 text-right">${Number(item.unit_price).toFixed(2)}</div>
                  <div className="w-20 text-right font-semibold">${Number(item.total_amount).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="text-xs space-y-1 mb-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${Number(sale.subtotal).toFixed(2)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-${Number(sale.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>VAT (15%):</span>
              <span>${Number(sale.tax_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t-2 border-gray-800 pt-1 mt-1">
              <span>TOTAL:</span>
              <span>${Number(sale.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Payment:</span>
              <span className="uppercase font-semibold">{sale.payment_method}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-t-2 border-dashed border-gray-800 pt-3 text-xs">
            <p className="font-bold">THANK YOU!</p>
            <p className="mt-1">شكراً لك</p>
            <p className="mt-2 text-[10px]">Please visit us again</p>
            <div className="mt-3 text-[10px]">
              <p>Powered by WesalTech</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
