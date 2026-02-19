import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  EyeIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { useTranslation, useDirectionClasses } from '@/lib/translation';
import { toast } from 'sonner';
import moment from 'moment';
import BranchSelector from '@/components/BranchSelector';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge, 
  Button,
  Input
} from '@/components/ui';
import { cn } from '@/lib/utils';

interface MaintenanceContract {
  id: number;
  customer_name: string;
  customer_phone?: string;
  product: {
    id: number;
    name: string;
  };
  frequency: string;
  start_date: string;
  end_date?: string;
  contract_value?: number;
  status: string;
  assigned_salesman?: {
    id: number;
    name: string;
  };
  next_visit_date?: string;
  branch?: {
    id: number;
    name: string;
    code: string;
  };
}

export default function MaintenanceContracts() {
  const navigate = useNavigate();
  const { t } = useTranslation('maintenance');
  const { isRTL } = useDirectionClasses();
  const [contracts, setContracts] = useState<MaintenanceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentBranch, setCurrentBranch] = useState<any>(null);

  useEffect(() => {
    fetchCurrentBranch();
    fetchContracts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContracts();
    }, 3400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCurrentBranch = async () => {
    try {
      const response = await api.get('/business/branches/current');
      setCurrentBranch(response.data?.branch || response.data);
    } catch (error: any) {
      // 404 means no current branch is set - this is OK for single-branch businesses
      if (error?.response?.status !== 404) {
        console.error('Failed to fetch current branch:', error);
      }
    }
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/maintenance/contracts', {
        params: { search }
      });
      // Handle paginated response structure
      const contractsData = response.data.data?.data || response.data.data || [];
      setContracts(Array.isArray(contractsData) ? contractsData : []);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      toast.error(t('failedToLoadContracts', { fallback: 'Failed to load maintenance contracts' }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contract: MaintenanceContract) => {
    if (!confirm(t('deleteConfirmation', { fallback: `Delete maintenance contract for ${contract.customer_name}?` }))) return;

    try {
      await api.delete(`/maintenance/contracts/${contract.id}`);
      toast.success(t('contractDeleted', { fallback: 'Contract deleted successfully' }));
      fetchContracts();
    } catch (error) {
      console.error('Failed to delete contract:', error);
      toast.error(t('failedToDelete', { fallback: 'Failed to delete contract' }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-1400 text-green-8400';
      case 'paused':
        return 'bg-yellow-1400 text-yellow-8400';
      case 'completed':
        return 'bg-blue-1400 text-blue-8400';
      case 'cancelled':
        return 'bg-red-1400 text-red-8400';
      default:
        return 'bg-gray-1400 text-gray-8400';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      once: t('once', { fallback: 'One Time' }),
      weekly: t('weekly', { fallback: 'Weekly' }),
      monthly: t('monthly', { fallback: 'Monthly' }),
      quarterly: t('quarterly', { fallback: 'Quarterly' }),
      semi_annual: t('semiAnnual', { fallback: 'Semi-Annual' }),
      annual: t('annual', { fallback: 'Annual' }),
      custom: t('custom', { fallback: 'Custom' }),
    };
    return labels[frequency] || frequency;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: t('active', { fallback: 'Active' }),
      paused: t('paused', { fallback: 'Paused' }),
      completed: t('completed', { fallback: 'Completed' }),
      cancelled: t('cancelled', { fallback: 'Cancelled' }),
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      {/* Header */}
      <div className={`flex items-center ${isRTL ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-8400">
            {t('maintenanceContracts', { fallback: 'Maintenance Contracts' })}
          </h1>
          <p className="mt-1 text-sm text-gray-5400">
            {t('contractsSubtitle', { fallback: 'Manage maintenance schedules and service contracts' })}
          </p>
        </div>
        <div className={`flex ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
          <BranchSelector onBranchChange={() => {
            fetchCurrentBranch();
            fetchContracts();
          }} />
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative max-w-md">
              <MagnifyingGlassIcon className={`h-5 w-5 absolute top-3 text-gray-4400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={t('searchContracts', { fallback: 'Search contracts...' })}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn('w-full', isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4')}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/business/maintenance/calendar')}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {t('viewCalendar', { fallback: 'View Calendar' })}
              </Button>
              <Button
                onClick={() => navigate('/business/maintenance/create')}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {t('createContract', { fallback: 'Create Contract' })}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-9400">
                {t('maintenanceContracts', { fallback: 'Maintenance Contracts' })}
              </h3>
              <p className="text-sm text-gray-6400 mt-1">
                {t('contractsSubtitle', { fallback: 'Manage maintenance schedules and service contracts' })}
              </p>
            </div>
            {currentBranch && (
              <Badge variant="secondary" className="flex items-center gap-2">
                <BuildingStorefrontIcon className="h-4 w-4" />
                {currentBranch.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-5400"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                      {t('customer', { fallback: 'Customer' })}
                    </TableHead>
                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                      {t('product', { fallback: 'Product' })}
                    </TableHead>
                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                      {t('frequency', { fallback: 'Frequency' })}
                    </TableHead>
                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                      {t('nextVisit', { fallback: 'Next Visit' })}
                    </TableHead>
                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                      {t('value', { fallback: 'Value' })}
                    </TableHead>
                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                      {t('status', { fallback: 'Status' })}
                    </TableHead>
                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                      {t('actions', { fallback: 'Actions' })}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-9400">{contract.customer_name}</span>
                          {contract.customer_phone && (
                            <span className="text-sm text-gray-5400">{contract.customer_phone}</span>
                          )}
                          {contract.branch && (
                            <Badge variant="secondary" className="mt-1 w-fit text-xs">
                              {contract.branch.name}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {contract.product.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-9400">{getFrequencyLabel(contract.frequency)}</span>
                      </TableCell>
                      <TableCell>
                        {contract.next_visit_date ? (
                          <span className="text-sm text-gray-9400">
                            {moment(contract.next_visit_date).format('MMM DD, YYYY')}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-4400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {contract.contract_value ? (
                          <span className="text-sm font-bold text-gray-9400">
                            ${Number(contract.contract_value).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-4400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contract.status)}>
                          {getStatusLabel(contract.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/business/maintenance/view/${contract.id}`)}
                            title={t('viewDetails', { fallback: 'View Details' })}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/business/maintenance/schedule/${contract.id}`)}
                            title={t('viewSchedule', { fallback: 'View Schedule' })}
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/business/maintenance/edit/${contract.id}`)}
                            title={t('edit', { fallback: 'Edit' })}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contract)}
                            title={t('delete', { fallback: 'Delete' })}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {contracts.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-1400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <WrenchScrewdriverIcon className="h-8 w-8 text-gray-4400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-5400">{t('noContracts', { fallback: 'No maintenance contracts' })}</h3>
                  <p className="mt-1 text-gray-4400">{t('getStarted', { fallback: 'Get started by creating your first maintenance contract.' })}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <div className="text-2xl font-bold text-gray-9400">{contracts.length}</div>
              <div className="text-sm text-gray-5400">{t('totalContracts', { fallback: 'Total Contracts' })}</div>
            </div>
            <div className="p-3 bg-primary-1400 rounded-full">
              <WrenchScrewdriverIcon className="h-6 w-6 text-primary-6400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <div className="text-2xl font-bold text-green-6400">
                {contracts.filter(c => c.status === 'active').length}
              </div>
              <div className="text-sm text-gray-5400">{t('active', { fallback: 'Active' })}</div>
            </div>
            <div className="p-3 bg-green-1400 rounded-full">
              <CalendarIcon className="h-6 w-6 text-green-6400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <div className="text-2xl font-bold text-blue-6400">
                {contracts.filter(c => c.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-5400">{t('completed', { fallback: 'Completed' })}</div>
            </div>
            <div className="p-3 bg-blue-1400 rounded-full">
              <EyeIcon className="h-6 w-6 text-blue-6400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <div className="text-2xl font-bold text-primary-6400">
                ${contracts.reduce((sum, c) => sum + (Number(c.contract_value) || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-5400">{t('totalValue', { fallback: 'Total Value' })}</div>
            </div>
            <div className="p-3 bg-yellow-1400 rounded-full">
              <BuildingStorefrontIcon className="h-6 w-6 text-yellow-6400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
