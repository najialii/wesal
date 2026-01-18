import { useEffect, useState } from 'react'
import { BaseModal } from '@/components/ui/base-modal'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Phone, 
  Calendar, 
  Clock,
  MapPin,
  Wrench,
  Star,
  DollarSign,
  Package,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface MaintenanceVisit {
  id: number
  scheduled_date: string
  scheduled_time?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'missed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  work_description?: string
  completion_notes?: string
  customer_rating?: number
  total_cost?: number
  actual_start_time?: string
  actual_end_time?: string
  next_visit_date?: string
  contract: {
    id: number
    customer_name: string
    customer_phone?: string
    customer_address?: string
    frequency: string
    start_date: string
    end_date?: string
    contract_value?: number
    product: {
      id: number
      name: string
    }
    sale: {
      id: number
      sale_number: string
    }
  }
  assigned_worker?: {
    id: number
    name: string
    job_title: string
    phone?: string
  }
  items?: MaintenanceVisitItem[]
}

interface MaintenanceVisitItem {
  id: number
  quantity_used: number
  unit_cost: number
  total_cost: number
  notes?: string
  maintenance_product: {
    id: number
    name: string
    sku: string
    unit: string
  }
}

interface MaintenanceDetailModalProps {
  isOpen: boolean
  onClose: () => void
  visitId: number
}

export function MaintenanceDetailModal({
  isOpen,
  onClose,
  visitId,
}: MaintenanceDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [visit, setVisit] = useState<MaintenanceVisit | null>(null)

  useEffect(() => {
    if (isOpen && visitId) {
      fetchVisitDetails()
    }
  }, [isOpen, visitId])

  const fetchVisitDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/maintenance/visits/${visitId}`)
      setVisit(response.data.visit)
    } catch (error: any) {
      console.error('Failed to fetch visit details:', error)
      toast.error('Failed to load visit details')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'missed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600'
      case 'high':
        return 'text-orange-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return null
    }
  }

  const handleClose = () => {
    setVisit(null)
    onClose()
  }

  if (loading) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Maintenance Visit Details"
        size="xl"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading visit details...</span>
        </div>
      </BaseModal>
    )
  }

  if (!visit) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Maintenance Visit Details"
        size="xl"
      >
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <AlertTriangle className="h-12 w-12 mb-4 text-yellow-500" />
          <p>Visit not found.</p>
          <Button onClick={handleClose} className="mt-4" variant="outline">
            Close
          </Button>
        </div>
      </BaseModal>
    )
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Maintenance Visit #${visit.id}`}
      size="xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Visit Header */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Wrench className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold">Visit #{visit.id}</h3>
              {getPriorityIcon(visit.priority)}
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(visit.status)}>
                {visit.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
              </Badge>
              <span className={`text-sm font-medium ${getPriorityColor(visit.priority)}`}>
                {visit.priority?.toUpperCase() || 'MEDIUM'} PRIORITY
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Scheduled:</span>
              <span className="font-medium">
                {new Date(visit.scheduled_date).toLocaleDateString()}
                {visit.scheduled_time && ` at ${visit.scheduled_time}`}
              </span>
            </div>
            
            {visit.actual_start_time && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Started:</span>
                <span className="font-medium">
                  {new Date(visit.actual_start_time).toLocaleString()}
                </span>
              </div>
            )}
            
            {visit.actual_end_time && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium">
                  {new Date(visit.actual_end_time).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Customer and Contract Information */}
        {visit.contract && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Customer & Contract Information</h3>
            <div className="bg-white border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">{visit.contract?.customer_name || 'N/A'}</span>
                  </div>
                  
                  {visit.contract?.customer_phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{visit.contract.customer_phone}</span>
                    </div>
                  )}
                  
                  {visit.contract?.customer_address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-gray-600">Address:</span>
                      <span className="font-medium">{visit.contract.customer_address}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Product:</span>
                    <span className="font-medium">{visit.contract?.product?.name || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Contract:</span>
                    <span className="font-medium">#{visit.contract?.id || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Frequency:</span>
                    <span className="font-medium">{visit.contract?.frequency || 'N/A'}</span>
                  </div>
                  
                  {visit.contract?.contract_value && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Contract Value:</span>
                      <span className="font-medium">${Number(visit.contract.contract_value).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assigned Worker */}
        {visit.assigned_worker && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Assigned Worker</h3>
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{visit.assigned_worker.name}</div>
                  <div className="text-sm text-gray-500">{visit.assigned_worker.job_title}</div>
                  {visit.assigned_worker.phone && (
                    <div className="text-sm text-gray-500">{visit.assigned_worker.phone}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Work Description */}
        {visit.work_description && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Work Description</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{visit.work_description}</p>
            </div>
          </div>
        )}

        {/* Maintenance Items */}
        {visit.items && visit.items.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Maintenance Items Used</h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visit.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.maintenance_product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              SKU: {item.maintenance_product.sku}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity_used} {item.maintenance_product.unit}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${Number(item.unit_cost).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${Number(item.total_cost).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Completion Details */}
        {visit.status === 'completed' && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Completion Details</h3>
            <div className="bg-white border rounded-lg p-4 space-y-4">
              {visit.completion_notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Completion Notes</h4>
                  <p className="text-gray-700">{visit.completion_notes}</p>
                </div>
              )}
              
              {visit.customer_rating && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Customer Rating</h4>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= visit.customer_rating!
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      ({visit.customer_rating}/5)
                    </span>
                  </div>
                </div>
              )}
              
              {visit.total_cost && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Total Cost</h4>
                  <div className="text-2xl font-bold text-green-600">
                    ${Number(visit.total_cost).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Visit */}
        {visit.next_visit_date && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Next Scheduled Visit</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {new Date(visit.next_visit_date).toLocaleDateString()}
                </span>
              </div>
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