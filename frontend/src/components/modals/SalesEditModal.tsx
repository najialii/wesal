import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormModal } from '@/components/ui/form-modal'
import { Form } from '@/components/ui/form'
import { TextField, SelectField, TextareaField } from '@/components/ui/form-fields'
import { toast } from 'sonner'
import api from '@/lib/api'

const salesEditSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: z.string().optional(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'credit'], {
    required_error: 'Payment method is required',
  }),
  payment_status: z.enum(['paid', 'pending', 'failed'], {
    required_error: 'Payment status is required',
  }),
  notes: z.string().optional(),
})

type SalesEditFormData = z.infer<typeof salesEditSchema>

interface Sale {
  id: number
  sale_number: string
  customer_name: string
  customer_phone?: string
  total_amount: string | number
  payment_method: string
  payment_status: string
  sale_date: string
  notes?: string
  items?: SaleItem[]
}

interface SaleItem {
  id: number
  product_id: number
  quantity: number
  unit_price: number
  total_amount: number
  product: {
    id: number
    name: string
    sku: string
  }
}

interface SalesEditModalProps {
  isOpen: boolean
  onClose: () => void
  saleId: number
  onSuccess: () => void
}

export function SalesEditModal({
  isOpen,
  onClose,
  saleId,
  onSuccess,
}: SalesEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [sale, setSale] = useState<Sale | null>(null)

  const form = useForm<SalesEditFormData>({
    resolver: zodResolver(salesEditSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      payment_method: 'cash',
      payment_status: 'paid',
      notes: '',
    },
  })

  // Fetch sale data when modal opens
  useEffect(() => {
    if (isOpen && saleId) {
      fetchSaleData()
    }
  }, [isOpen, saleId])

  const fetchSaleData = async () => {
    try {
      setFetchingData(true)
      const response = await api.get(`/pos/sales/${saleId}`)
      const saleData = response.data.sale || response.data
      
      setSale(saleData)
      
      // Pre-populate form with existing data
      form.reset({
        customer_name: saleData.customer_name || '',
        customer_phone: saleData.customer_phone || '',
        payment_method: saleData.payment_method || 'cash',
        payment_status: saleData.payment_status || 'paid',
        notes: saleData.notes || '',
      })
    } catch (error: any) {
      console.error('Failed to fetch sale data:', error)
      toast.error('Failed to load sale data')
      onClose()
    } finally {
      setFetchingData(false)
    }
  }

  const handleSubmit = async (data: SalesEditFormData) => {
    try {
      setLoading(true)
      
      await api.put(`/pos/sales/${saleId}`, {
        customer_name: data.customer_name,
        customer_phone: data.customer_phone || null,
        payment_method: data.payment_method,
        payment_status: data.payment_status,
        notes: data.notes || null,
      })

      toast.success('Sale updated successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Failed to update sale:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update sale'
      toast.error(errorMessage)
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        Object.keys(errors).forEach((field) => {
          form.setError(field as keyof SalesEditFormData, {
            message: errors[field][0],
          })
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    setSale(null)
    onClose()
  }

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit', label: 'Credit' },
  ]

  const paymentStatusOptions = [
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
  ]

  if (fetchingData) {
    return (
      <FormModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Edit Sale"
        size="lg"
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading sale data...</span>
        </div>
      </FormModal>
    )
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit Sale ${sale?.sale_number || ''}`}
      description="Update sale information and payment details"
      size="lg"
      onSubmit={form.handleSubmit(handleSubmit)}
      loading={loading}
      submitText="Update Sale"
      submitDisabled={!form.formState.isValid}
    >
      <Form {...form}>
        <div className="space-y-4">
          {/* Sale Information Display */}
          {sale && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Sale Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Invoice:</span>
                  <span className="ml-2 font-medium">{sale.sale_number}</span>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <span className="ml-2">{new Date(sale.sale_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Amount:</span>
                  <span className="ml-2 font-medium">${Number(sale.total_amount).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Items:</span>
                  <span className="ml-2">{sale.items?.length || 0} items</span>
                </div>
              </div>
            </div>
          )}

          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              form={form}
              name="customer_name"
              label="Customer Name"
              placeholder="Enter customer name"
              required
            />

            <TextField
              form={form}
              name="customer_phone"
              label="Customer Phone"
              type="tel"
              placeholder="Enter phone number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              form={form}
              name="payment_method"
              label="Payment Method"
              placeholder="Select payment method"
              options={paymentMethodOptions}
              required
            />

            <SelectField
              form={form}
              name="payment_status"
              label="Payment Status"
              placeholder="Select payment status"
              options={paymentStatusOptions}
              required
            />
          </div>

          <TextareaField
            form={form}
            name="notes"
            label="Notes"
            placeholder="Add any additional notes..."
            rows={3}
          />

          {/* Sale Items Display (Read-only) */}
          {sale?.items && sale.items.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Sale Items</h3>
              <div className="space-y-2">
                {sale.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <span className="font-medium">{item.product.name}</span>
                      <span className="text-gray-500 ml-2">({item.product.sku})</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${Number(item.total_amount).toFixed(2)}</div>
                      <div className="text-sm text-gray-500">
                        {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Form>
    </FormModal>
  )
}