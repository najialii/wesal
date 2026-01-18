import { useEffect, useState } from 'react'
import { BaseModal } from '@/components/ui/base-modal'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Phone, 
  Calendar, 
  CreditCard, 
  FileText, 
  Package,
  Receipt,
  Loader2,
  Building2
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface Sale {
  id: number
  sale_number: string
  customer_name: string
  customer_phone?: string
  customer_tax_id?: string
  total_amount: string | number
  subtotal: string | number
  tax_amount: string | number
  discount_amount: string | number
  payment_method: string
  payment_status: string
  sale_date: string
  notes?: string
  salesman?: {
    id: number
    name: string
  }
  branch?: {
    id: number
    name: string
    code: string
  }
  items: SaleItem[]
}

interface SaleItem {
  id: number
  product_id: number
  quantity: number
  unit_price: number
  tax_rate: number
  discount_amount: number
  total_amount: number
  product: {
    id: number
    name: string
    sku: string
  }
}

interface MaintenanceContract {
  id: number
  frequency: string
  start_date: string
  end_date?: string
  status: string
  contract_value?: number
}

interface SalesDetailModalProps {
  isOpen: boolean
  onClose: () => void
  saleId: number
}

export function SalesDetailModal({
  isOpen,
  onClose,
  saleId,
}: SalesDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [sale, setSale] = useState<Sale | null>(null)
  const [maintenanceContracts, setMaintenanceContracts] = useState<MaintenanceContract[]>([])

  useEffect(() => {
    if (isOpen && saleId) {
      fetchSaleDetails()
    }
  }, [isOpen, saleId])

  const fetchSaleDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/pos/sales/${saleId}`)
      const data = response.data
      
      setSale(data.sale)
      setMaintenanceContracts(data.maintenance_contracts || [])
    } catch (error: any) {
      console.error('Failed to fetch sale details:', error)
      toast.error('Failed to load sale details')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash'
      case 'card':
        return 'Card'
      case 'bank_transfer':
        return 'Bank Transfer'
      case 'credit':
        return 'Credit'
      default:
        return method
    }
  }

  const handleClose = () => {
    setSale(null)
    setMaintenanceContracts([])
    onClose()
  }

  if (loading) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Sale Details"
        size="xl"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading sale details...</span>
        </div>
      </BaseModal>
    )
  }

  if (!sale) {
    return null
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Sale Details - ${sale.sale_number}`}
      size="xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Sale Header */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold">{sale.sale_number}</h3>
            </div>
            <Badge className={getPaymentStatusColor(sale.payment_status)}>
              {sale.payment_status.toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {new Date(sale.sale_date).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Payment:</span>
              <span className="font-medium">
                {getPaymentMethodLabel(sale.payment_method)}
              </span>
            </div>
            
            {sale.branch && (
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Branch:</span>
                <span className="font-medium">{sale.branch.name}</span>
              </div>
            )}
            
            {sale.salesman && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Salesman:</span>
                <span className="font-medium">{sale.salesman.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
          <div className="bg-white border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{sale.customer_name}</span>
              </div>
              
              {sale.customer_phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{sale.customer_phone}</span>
                </div>
              )}
              
              {sale.customer_tax_id && (
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Tax ID:</span>
                  <span className="font-medium">{sale.customer_tax_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sale Items */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Sale Items ({sale.items.length})
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sale.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {item.product.sku}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.tax_rate}%
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${Number(item.discount_amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${Number(item.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Payment Summary</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${Number(sale.subtotal).toFixed(2)}</span>
              </div>
              
              {Number(sale.discount_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">
                    -${Number(sale.discount_amount).toFixed(2)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">${Number(sale.tax_amount).toFixed(2)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>${Number(sale.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Contracts */}
        {maintenanceContracts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Maintenance Contracts</h3>
            <div className="space-y-3">
              {maintenanceContracts.map((contract) => (
                <div key={contract.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Contract #{contract.id}</span>
                    <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                      {contract.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Frequency:</span>
                      <span className="ml-2 font-medium">{contract.frequency}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <span className="ml-2 font-medium">
                        {new Date(contract.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    {contract.contract_value && (
                      <div>
                        <span className="text-gray-600">Value:</span>
                        <span className="ml-2 font-medium">
                          ${Number(contract.contract_value).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {sale.notes && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Notes</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{sale.notes}</p>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button onClick={handleClose} variant="outline">
          Close
        </Button>
      </DialogFooter>
    </BaseModal>
  )
}