import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  CheckCircle,
  Package,
  Search,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { technicianService, TechnicianVisit } from '@/services/technician';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';

export default function VisitHistory() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<TechnicianVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await technicianService.getHistory();
      setVisits(data.data || []);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load visit history');
    } finally {
      setLoading(false);
    }
  };

  const filteredVisits = visits.filter(visit => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (visit.contract?.customer?.name || visit.contract?.customer_name || '').toLowerCase().includes(query) ||
      visit.contract?.customer?.phone?.toLowerCase().includes(query) ||
      visit.contract?.customer_phone?.toLowerCase().includes(query) ||
      visit.work_description?.toLowerCase().includes(query)
    );
  });

  const calculateDuration = (visit: TechnicianVisit) => {
    if (!visit.actual_start_time || !visit.actual_end_time) return null;
    
    const start = new Date(visit.actual_start_time);
    const end = new Date(visit.actual_end_time);
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-h1">Visit History</h1>
        <p className="text-caption">View your completed maintenance visits</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by customer name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visits List */}
      {filteredVisits.length > 0 ? (
        <div className="space-y-4">
          {filteredVisits.map((visit) => {
            const duration = calculateDuration(visit);
            
            return (
              <Card
                key={visit.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/technician/visits/${visit.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-lg text-gray-900">
                          {visit.contract?.customer?.name || visit.contract?.customer_name || 'N/A'}
                        </h3>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(visit.scheduled_date).toLocaleDateString()}</span>
                        </div>
                        {duration && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Duration: {duration}</span>
                          </div>
                        )}
                        {visit.products && visit.products.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>{visit.products.length} part{visit.products.length !== 1 ? 's' : ''} used</span>
                          </div>
                        )}
                      </div>

                      {/* Work Description */}
                      {visit.work_description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {visit.work_description}
                        </p>
                      )}

                      {/* Completion Notes Preview */}
                      {visit.completion_notes && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Completion Notes:</p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {visit.completion_notes}
                          </p>
                        </div>
                      )}

                      {/* Cost */}
                      {visit.total_cost && visit.total_cost > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <span className="text-sm font-medium text-gray-700">Total Cost</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatCurrency(visit.total_cost)}
                          </span>
                        </div>
                      )}
                    </div>

                    <ArrowRight className="h-5 w-5 text-gray-400 ml-4 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No completed visits"
          description={searchQuery ? "Try adjusting your search" : "You haven't completed any visits yet"}
        />
      )}
    </div>
  );
}
