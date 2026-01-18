import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Star,
  Package,
  AlertTriangle,
  ArrowLeft,
  Edit,
  Trash2,
  Box
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useTranslation, useDirectionClasses } from '@/lib/translation';
import { formatCurrency } from '@/lib/currency';
import { getImageUrl } from '@/lib/imageUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  image?: string;
  selling_price?: number;
}

interface MaintenanceVisit {
  id: number;
  scheduled_date: string;
  scheduled_time?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'missed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  work_description?: string;
  completion_notes?: string;
  customer_rating?: number;
  total_cost?: number;
  actual_start_time?: string;
  actual_end_time?: string;
  next_visit_date?: string;
  contract: {
    id: number;
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    customer_address?: string;
    frequency: string;
    start_date: string;
    end_date?: string;
    contract_value?: number;
    product: Product;
    assigned_technician?: {
      id: number;
      name: string;
      email?: string;
    };
    sale?: {
      id: number;
      sale_number: string;
    };
  };
  assigned_worker?: {
    id: number;
    name: string;
    job_title: string;
    phone?: string;
  };
  items?: MaintenanceVisitItem[];
}

interface MaintenanceVisitItem {
  id: number;
  quantity_used: number;
  unit_cost: number;
  total_cost: number;
  notes?: string;
  maintenance_product: {
    id: number;
    name: string;
    sku: string;
    unit: string;
    type?: string;
  };
}

export default function MaintenanceVisitView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('maintenance');
  const { isRTL } = useDirectionClasses();
  const [loading, setLoading] = useState(true);
  const [visit, setVisit] = useState<MaintenanceVisit | null>(null);

  useEffect(() => {
    if (id) {
      fetchVisitDetails();
    }
  }, [id]);

  const fetchVisitDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/maintenance/visits/${id}`);
      console.log('Full API Response:', response.data);
      console.log('Visit data:', response.data.visit);
      console.log('Contract:', response.data.visit?.contract);
      console.log('Product:', response.data.visit?.contract?.product);
      console.log('Items:', response.data.visit?.items);
      setVisit(response.data.visit);
    } catch (error: any) {
      console.error('Failed to fetch visit details:', error);
      toast.error(t('failedToLoadVisit', { fallback: 'Failed to load visit details' }));
      navigate('/business/maintenance/calendar');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'scheduled':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'missed':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="pt-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="pt-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!visit || !visit.contract) {
    return (
      <div className="p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-h3 text-gray-900 mb-2">{t('visitDataUnavailable', { fallback: 'Visit data is incomplete or unavailable.' })}</p>
            <p className="text-caption mb-6">{t('visitDataUnavailableDesc', { fallback: 'The visit information could not be loaded.' })}</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/business/maintenance/calendar')}
                className="btn-secondary"
              >
                {t('backToCalendar', { fallback: 'Back to Calendar' })}
              </button>
              <button
                onClick={fetchVisitDetails}
                className="btn-primary"
              >
                {t('retry', { fallback: 'Retry' })}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <button
          onClick={() => navigate('/business/maintenance/calendar')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors w-fit group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>{t('backToCalendar', { fallback: 'Back to Calendar' })}</span>
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-h1">
                {t('visit', { fallback: 'Visit' })} #{visit.id}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(visit.status)}`}>
                {t(visit.status, { fallback: visit.status.replace('_', ' ').toUpperCase() })}
              </span>
            </div>
            <p className="text-caption">
              {visit.contract?.customer_name} • {visit.contract?.product?.name}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="btn-secondary inline-flex items-center gap-2">
              <Edit className="h-4 w-4" />
              {t('edit', { fallback: 'Edit' })}
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="h-4 w-4" />
              {t('delete', { fallback: 'Delete' })}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule Info */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-h3">{t('scheduleInformation', { fallback: 'Schedule Information' })}</CardTitle>
                <div className="flex items-center gap-2">
                  {getPriorityIcon(visit.priority)}
                  <span className={`text-xs font-medium ${getPriorityColor(visit.priority)}`}>
                    {t(visit.priority, { fallback: visit.priority.toUpperCase() })}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-caption mb-2">{t('scheduledDate', { fallback: 'Scheduled Date' })}</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {new Date(visit.scheduled_date).toLocaleDateString()}
                  </div>
                  {visit.scheduled_time && (
                    <div className="text-xs text-gray-600 mt-1">
                      {visit.scheduled_time}
                    </div>
                  )}
                </div>
                
                {visit.actual_start_time && (
                  <div>
                    <div className="text-caption mb-2">{t('actualStart', { fallback: 'Started' })}</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {new Date(visit.actual_start_time).toLocaleTimeString()}
                    </div>
                  </div>
                )}
                
                {visit.actual_end_time && (
                  <div>
                    <div className="text-caption mb-2">{t('completed', { fallback: 'Completed' })}</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {new Date(visit.actual_end_time).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Being Maintained */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-h3">{t('productBeingMaintained', { fallback: 'Product Being Maintained' })}</CardTitle>
            </CardHeader>
            
            <CardContent className="pt-6">
              {visit.contract?.product ? (
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                      {visit.contract.product.image ? (
                        <img 
                          src={getImageUrl(visit.contract.product.image)}
                          alt={visit.contract.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('Image failed to load:', visit.contract.product.image);
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<svg class="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                          }}
                        />
                      ) : (
                        <Package className="h-10 w-10 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      {visit.contract.product.name}
                    </h3>
                    
                    {visit.contract.product.sku && (
                      <p className="text-caption mb-3">
                        SKU: {visit.contract.product.sku}
                      </p>
                    )}
                    
                    {visit.contract.product.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {visit.contract.product.description}
                      </p>
                    )}
                    
                    {visit.contract.product.selling_price && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-caption">{t('productValue', { fallback: 'Value' })}:</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(Number(visit.contract.product.selling_price))}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-caption">{t('noProductInfo', { fallback: 'Product information not available' })}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Spare Parts Used */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-h3">{t('sparePartsUsed', { fallback: 'Spare Parts & Materials Used' })}</CardTitle>
                {visit.items && visit.items.length > 0 && (
                  <span className="text-caption">
                    {visit.items.length} {t('items', { fallback: 'items' })}
                  </span>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              {visit.items && visit.items.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {visit.items.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                              {item.maintenance_product.name}
                            </h3>
                            <p className="text-caption mb-3">
                              SKU: {item.maintenance_product.sku}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span>
                                {t('quantity', { fallback: 'Qty' })}: <span className="font-semibold text-gray-900">{item.quantity_used} {item.maintenance_product.unit}</span>
                              </span>
                              <span>
                                {t('unitCost', { fallback: 'Unit' })}: <span className="font-semibold text-gray-900">{formatCurrency(Number(item.unit_cost))}</span>
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-xs text-gray-600 mt-3 italic bg-white px-3 py-2 rounded border border-gray-200">
                                {item.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-base font-bold text-gray-900">
                              {formatCurrency(Number(item.total_cost))}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">{t('totalPartsValue', { fallback: 'Total Parts Value' })}</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(visit.items.reduce((sum, item) => sum + Number(item.total_cost), 0))}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Box className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-caption">{t('noSpareParts', { fallback: 'No spare parts or materials used in this visit' })}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-h3">{t('customerInformation', { fallback: 'Customer Information' })}</CardTitle>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-5">
              <div>
                <div className="text-caption mb-1">{t('customerName', { fallback: 'Name' })}</div>
                <div className="text-sm font-semibold text-gray-900">{visit.contract?.customer_name}</div>
              </div>
              
              {visit.contract?.customer_phone && (
                <div>
                  <div className="text-caption mb-1">{t('phone', { fallback: 'Phone' })}</div>
                  <div className="text-sm text-gray-900">{visit.contract.customer_phone}</div>
                </div>
              )}
              
              {visit.contract?.customer_email && (
                <div>
                  <div className="text-caption mb-1">{t('email', { fallback: 'Email' })}</div>
                  <div className="text-sm text-gray-900">{visit.contract.customer_email}</div>
                </div>
              )}
              
              {visit.contract?.customer_address && (
                <div>
                  <div className="text-caption mb-1">{t('address', { fallback: 'Address' })}</div>
                  <div className="text-sm text-gray-900">{visit.contract.customer_address}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Description */}
          {visit.work_description && (
            <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-h3">{t('workDescription', { fallback: 'Work Description' })}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-700 leading-relaxed">{visit.work_description}</p>
              </CardContent>
            </Card>
          )}

          {/* Completion Details */}
          {visit.status === 'completed' && (
            <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-h3">{t('completionDetails', { fallback: 'Completion Details' })}</CardTitle>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-5">
                {visit.completion_notes && (
                  <div>
                    <div className="text-caption mb-2">{t('completionNotes', { fallback: 'Notes' })}</div>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">{visit.completion_notes}</p>
                  </div>
                )}
                
                {visit.customer_rating && (
                  <div>
                    <div className="text-caption mb-2">{t('customerRating', { fallback: 'Rating' })}</div>
                    <div className="flex items-center gap-1">
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
                      <span className="ml-2 text-sm font-medium text-gray-600">
                        ({visit.customer_rating}/5)
                      </span>
                    </div>
                  </div>
                )}
                
                {visit.total_cost && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-caption mb-2">{t('totalCost', { fallback: 'Total Cost' })}</div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(Number(visit.total_cost))}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Contract Info */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-h3">{t('contractDetails', { fallback: 'Contract Details' })}</CardTitle>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-5">
              <div>
                <div className="text-caption mb-1">{t('contractId', { fallback: 'Contract ID' })}</div>
                <div className="text-sm font-semibold text-gray-900">#{visit.contract?.id}</div>
              </div>
              
              <div>
                <div className="text-caption mb-1">{t('frequency', { fallback: 'Frequency' })}</div>
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {visit.contract?.frequency}
                </span>
              </div>
              
              {visit.contract?.contract_value && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-caption mb-1">{t('contractValue', { fallback: 'Contract Value' })}</div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(Number(visit.contract.contract_value))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Technician */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-h3">{t('assignedTechnician', { fallback: 'Assigned Technician' })}</CardTitle>
            </CardHeader>
            
            <CardContent className="pt-6">
              {visit.assigned_worker ? (
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-blue-100">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{visit.assigned_worker.name}</div>
                    <div className="text-caption">{visit.assigned_worker.job_title}</div>
                    {visit.assigned_worker.phone && (
                      <div className="text-xs text-gray-600 mt-1">{visit.assigned_worker.phone}</div>
                    )}
                  </div>
                </div>
              ) : visit.contract?.assigned_technician ? (
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-blue-100">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{visit.contract.assigned_technician.name}</div>
                    <div className="text-caption">{t('fromContract', { fallback: 'From contract' })}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
                    <User className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="text-caption mb-4">{t('noTechnicianAssigned', { fallback: 'No technician assigned yet' })}</p>
                  <button className="btn-secondary text-sm">
                    {t('assignTechnician', { fallback: 'Assign Technician' })}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Visit */}
          {visit.next_visit_date && (
            <Card className="bg-white border border-gray-200 rounded-lg shadow-subtle">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-h3">{t('nextScheduledVisit', { fallback: 'Next Visit' })}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-caption mb-0.5">{t('scheduledFor', { fallback: 'Scheduled for' })}</div>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(visit.next_visit_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
