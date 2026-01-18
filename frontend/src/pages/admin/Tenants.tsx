import { useEffect, useState } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  EllipsisVerticalIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  PencilIcon,
  EyeIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { Tenant, PaginatedResponse } from '../../types';

const StatusBadge = ({ status }: { status: string }) => {
  const variants = {
    active: 'default' as const,
    suspended: 'secondary' as const,
    cancelled: 'destructive' as const,
  };

  return (
    <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

interface BulkActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'suspend' | 'activate' | 'delete' | null;
  selectedCount: number;
  onConfirm: () => void;
}

const BulkActionDialog = ({ isOpen, onClose, action, selectedCount, onConfirm }: BulkActionDialogProps) => {
  const getActionText = () => {
    switch (action) {
      case 'suspend': return 'Suspend Organizations';
      case 'activate': return 'Activate Organizations';
      case 'delete': return 'Delete Organizations';
      default: return '';
    }
  };

  const getConfirmationText = () => {
    switch (action) {
      case 'suspend': return `Are you sure you want to suspend ${selectedCount} organization(s)?`;
      case 'activate': return `Are you sure you want to activate ${selectedCount} organization(s)?`;
      case 'delete': return `Are you sure you want to delete ${selectedCount} organization(s)? This action cannot be undone.`;
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getActionText()}</DialogTitle>
          <DialogDescription>
            {getConfirmationText()}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant={action === 'delete' ? 'destructive' : 'default'} 
            onClick={onConfirm}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function Tenants() {
  const [tenants, setTenants] = useState<PaginatedResponse<Tenant> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'suspend' | 'activate' | 'delete' | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchTenants = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(search && { search }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(planFilter && planFilter !== 'all' && { plan: planFilter }),
      });
      
      const response = await api.get(`/admin/tenants?${params}`);
      setTenants(response.data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      toast.error('An error occurred while loading organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [search, statusFilter, planFilter, sortBy, sortOrder]);

  const handleSuspend = async (tenant: Tenant) => {
    try {
      await api.post(`/admin/tenants/${tenant.id}/suspend`);
      toast.success('Organization suspended successfully');
      fetchTenants();
    } catch (error) {
      console.error('Failed to suspend organization:', error);
      toast.error('Failed to suspend organization');
    }
  };

  const handleActivate = async (tenant: Tenant) => {
    try {
      await api.post(`/admin/tenants/${tenant.id}/activate`);
      toast.success('Organization activated successfully');
      fetchTenants();
    } catch (error) {
      console.error('Failed to activate organization:', error);
      toast.error('Failed to activate organization');
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    try {
      await api.delete(`/admin/tenants/${tenant.id}`);
      toast.success('Organization deleted successfully');
      fetchTenants();
    } catch (error) {
      console.error('Failed to delete organization:', error);
      toast.error('Failed to delete organization');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && tenants) {
      setSelectedTenants(tenants.data.map(tenant => tenant.id));
    } else {
      setSelectedTenants([]);
    }
  };

  const handleSelectTenant = (tenantId: string, checked: boolean) => {
    if (checked) {
      setSelectedTenants(prev => [...prev, tenantId]);
    } else {
      setSelectedTenants(prev => prev.filter(id => id !== tenantId));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedTenants.length === 0) return;

    try {
      const endpoint = bulkAction === 'delete' ? 'delete' : bulkAction;
      await api.post(`/admin/tenants/bulk-${endpoint}`, {
        tenant_ids: selectedTenants
      });
      
      const message = bulkAction === 'suspend' ? 'Organizations suspended successfully' :
                     bulkAction === 'activate' ? 'Organizations activated successfully' :
                     'Organizations deleted successfully';
      
      toast.success(message);
      setSelectedTenants([]);
      setBulkAction(null);
      fetchTenants();
    } catch (error) {
      console.error(`Failed to ${bulkAction} tenants:`, error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(planFilter && planFilter !== 'all' && { plan: planFilter }),
      });
      
      const response = await api.get(`/admin/tenants/export?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tenants.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Organizations exported successfully');
    } catch (error) {
      console.error('Failed to export tenants:', error);
      toast.error('Failed to export organizations');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage organizations and their subscriptions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link to="/admin/organizations/create">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Organization
            </Link>
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTenants.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {selectedTenants.length} organization(s) selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setBulkAction('activate')}
              >
                <PlayIcon className="h-4 w-4 mr-1" />
                Activate
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setBulkAction('suspend')}
              >
                <PauseIcon className="h-4 w-4 mr-1" />
                Suspend
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setBulkAction('delete')}
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Search and filter organizations</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {showFilters && (
              <>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Created Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            {tenants ? `${tenants.total} total organizations` : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!tenants ? (
            <div className="flex items-center justify-center h-64">
              <Alert className="max-w-md">
                <AlertDescription>
                  An error occurred while loading organizations
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTenants.length === tenants.data.length && tenants.data.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Organization Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.data.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTenants.includes(tenant.id)}
                        onCheckedChange={(checked) => handleSelectTenant(tenant.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <img
                            src={tenant.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tenant.name)}&color=7F9CF5&background=EBF4FF&size=40`}
                            alt={`${tenant.name} logo`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tenant.name)}&color=7F9CF5&background=EBF4FF&size=40`;
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-muted-foreground">{tenant.domain}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{tenant.plan?.name || 'No Plan'}</div>
                        <div className="text-sm text-muted-foreground">
                          ${tenant.plan?.price || 0}/month
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tenant.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/organizations/${tenant.id}`}>
                              <EyeIcon className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/organizations/${tenant.id}/edit`}>
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {tenant.status === 'active' ? (
                            <DropdownMenuItem onClick={() => handleSuspend(tenant)}>
                              <PauseIcon className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleActivate(tenant)}>
                              <PlayIcon className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(tenant)}
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {tenants && tenants.last_page > 1 && (
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="text-sm text-muted-foreground">
              Showing {tenants.from} to {tenants.to} of {tenants.total} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTenants(tenants.current_page - 1)}
                disabled={tenants.current_page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTenants(tenants.current_page + 1)}
                disabled={tenants.current_page === tenants.last_page}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <BulkActionDialog
        isOpen={!!bulkAction}
        onClose={() => setBulkAction(null)}
        action={bulkAction}
        selectedCount={selectedTenants.length}
        onConfirm={handleBulkAction}
      />
    </div>
  );
}