import { useEffect, useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, Bars3Icon, ChartBarIcon, UserGroupIcon, CurrencyDollarIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '../../lib/i18n/TranslationProvider';
import api from '../../lib/api';
import { toast } from 'sonner';

interface Plan {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  limits: Record<string, number>;
  trial_days?: number;
  is_active: boolean;
  sort_order: number;
  tenants_count?: number;
  subscriptions_count?: number;
  revenue?: number;
  created_at: string;
  updated_at: string;
}

interface Tenant {
  id: number;
  name: string;
  domain: string;
  status: string;
  plan_id?: number;
  plan?: Plan;
  created_at: string;
}

interface PlanAnalytics {
  plan_id: number;
  plan_name: string;
  total_tenants: number;
  active_tenants: number;
  total_revenue: number;
  monthly_revenue: number;
  growth_rate: number;
  churn_rate: number;
  usage_metrics: Record<string, number>;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

const BillingCycleBadge = ({ cycle }: { cycle: string }) => {
  const colors = {
    monthly: 'default',
    yearly: 'secondary',
    lifetime: 'outline',
  } as const;

  return (
    <Badge variant={colors[cycle as keyof typeof colors] || 'default'}>
      {cycle}
    </Badge>
  );
};

const PlanAnalyticsView = ({ plan }: { plan: Plan }) => {
  const { t } = useTranslation('admin');
  const [analytics, setAnalytics] = useState<PlanAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlanAnalytics();
  }, [plan.id]);

  const fetchPlanAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/plans/${plan.id}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch plan analytics:', error);
      toast.error(t('messages.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Alert>
        <AlertDescription>
          {t('messages.no_data')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('plans.tenant_count')}</p>
                <p className="text-2xl font-bold">{analytics.total_tenants}</p>
                <p className="text-xs text-green-600">
                  {analytics.active_tenants} {t('tenants.active')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('plans.revenue')}</p>
                <p className="text-2xl font-bold">${analytics.total_revenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  ${analytics.monthly_revenue.toLocaleString()}/mo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowUpIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <p className="text-2xl font-bold">{analytics.growth_rate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowDownIcon className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">{analytics.churn_rate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Metrics</CardTitle>
          <CardDescription>Resource utilization across all tenants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.usage_metrics).map(([key, value]) => {
              const limit = plan.limits[key] || 100;
              const percentage = Math.min((value / limit) * 100, 100);
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{key.replace('_', ' ')}</span>
                    <span>{value} / {limit}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const TenantAssignmentView = ({ plan }: { plan: Plan }) => {
  const { t } = useTranslation('admin');
  const [tenants, setTenants] = useState<PaginatedResponse<Tenant> | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchPlanTenants();
    fetchAvailableTenants();
  }, [plan.id]);

  const fetchPlanTenants = async () => {
    try {
      const response = await api.get(`/admin/plans/${plan.id}/tenants`);
      setTenants(response.data);
    } catch (error) {
      console.error('Failed to fetch plan tenants:', error);
    }
  };

  const fetchAvailableTenants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/tenants?without_plan=true');
      setAvailableTenants(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch available tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTenant = async (tenantId: number) => {
    try {
      setAssignLoading(true);
      await api.post(`/admin/tenants/${tenantId}/assign-plan`, {
        plan_id: plan.id
      });
      toast.success(t('messages.operation_successful'));
      fetchPlanTenants();
      fetchAvailableTenants();
    } catch (error) {
      console.error('Failed to assign tenant:', error);
      toast.error(t('messages.operation_failed'));
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUnassignTenant = async (tenantId: number) => {
    if (!confirm('Are you sure you want to unassign this tenant from the plan?')) return;

    try {
      await api.delete(`/admin/tenants/${tenantId}/assign-plan`);
      toast.success(t('messages.operation_successful'));
      fetchPlanTenants();
      fetchAvailableTenants();
    } catch (error) {
      console.error('Failed to unassign tenant:', error);
      toast.error(t('messages.operation_failed'));
    }
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* Current Tenants */}
      <Card>
        <CardHeader>
          <CardTitle>Current Tenants ({tenants?.total || 0})</CardTitle>
          <CardDescription>Tenants currently assigned to this plan</CardDescription>
        </CardHeader>
        <CardContent>
          {!tenants || tenants.data.length === 0 ? (
            <Alert>
              <AlertDescription>No tenants assigned to this plan yet.</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tenants.tenant_name')}</TableHead>
                  <TableHead>{t('tenants.domain')}</TableHead>
                  <TableHead>{t('tenants.status')}</TableHead>
                  <TableHead>{t('tenants.created')}</TableHead>
                  <TableHead className="text-right">{t('tenants.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.data.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.domain}</TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassignTenant(tenant.id)}
                      >
                        Unassign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Available Tenants */}
      <Card>
        <CardHeader>
          <CardTitle>Available Tenants ({availableTenants.length})</CardTitle>
          <CardDescription>Tenants without a plan that can be assigned</CardDescription>
        </CardHeader>
        <CardContent>
          {availableTenants.length === 0 ? (
            <Alert>
              <AlertDescription>All tenants are already assigned to plans.</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tenants.tenant_name')}</TableHead>
                  <TableHead>{t('tenants.domain')}</TableHead>
                  <TableHead>{t('tenants.status')}</TableHead>
                  <TableHead>{t('tenants.created')}</TableHead>
                  <TableHead className="text-right">{t('tenants.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.domain}</TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleAssignTenant(tenant.id)}
                        disabled={assignLoading}
                      >
                        Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const PlanForm = ({ 
  plan, 
  onSave, 
  onCancel 
}: { 
  plan?: Plan; 
  onSave: (data: any) => void; 
  onCancel: () => void; 
}) => {
  const { t } = useTranslation('admin');
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    description: plan?.description || '',
    price: plan?.price || 0,
    billing_cycle: plan?.billing_cycle || 'monthly',
    features: plan?.features?.join('\n') || '',
    limits: JSON.stringify(plan?.limits || {}, null, 2),
    trial_days: plan?.trial_days || 0,
    is_active: plan?.is_active ?? true,
    sort_order: plan?.sort_order || 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        features: formData.features.split('\n').filter(f => f.trim()),
        limits: JSON.parse(formData.limits),
      };
      onSave(data);
    } catch (error) {
      toast.error('Invalid JSON in limits field');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('plans.plan_name')}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">{t('plans.price')}</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('plans.description')}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Plan description..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="billing_cycle">{t('plans.billing_cycle')}</Label>
          <Select value={formData.billing_cycle} onValueChange={(value) => setFormData({ ...formData, billing_cycle: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">{t('plans.monthly')}</SelectItem>
              <SelectItem value="yearly">{t('plans.yearly')}</SelectItem>
              <SelectItem value="lifetime">{t('plans.lifetime')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="trial_days">{t('plans.trial_days')}</Label>
          <Input
            id="trial_days"
            type="number"
            value={formData.trial_days}
            onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sort_order">{t('plans.sort_order')}</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="features">{t('plans.features')}</Label>
        <Textarea
          id="features"
          value={formData.features}
          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          placeholder="pos&#10;inventory&#10;maintenance&#10;reports"
          rows={4}
        />
        <p className="text-sm text-muted-foreground">One feature per line</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="limits">{t('plans.limits')}</Label>
        <Textarea
          id="limits"
          value={formData.limits}
          onChange={(e) => setFormData({ ...formData, limits: e.target.value })}
          placeholder='{"users": 10, "products": 1000}'
          rows={4}
        />
        <p className="text-sm text-muted-foreground">JSON format</p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">{t('plans.is_active')}</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('forms.cancel')}
        </Button>
        <Button type="submit">
          {plan ? t('forms.update') : t('forms.create')}
        </Button>
      </div>
    </form>
  );
};

export default function Plans() {
  const [plans, setPlans] = useState<PaginatedResponse<Plan> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [draggedPlan, setDraggedPlan] = useState<Plan | null>(null);
  const { t } = useTranslation('admin');

  useEffect(() => {
    fetchPlans();
  }, [search, activeFilter]);

  const fetchPlans = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(activeFilter !== 'all' && { is_active: activeFilter === 'active' ? 'true' : 'false' }),
      });
      
      const response = await api.get(`/admin/plans?${params}`);
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      toast.error(t('messages.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (formData: any) => {
    try {
      await api.post('/admin/plans', formData);
      toast.success(t('messages.plan_created'));
      setIsCreateModalOpen(false);
      fetchPlans();
    } catch (error) {
      console.error('Failed to create plan:', error);
      toast.error(t('messages.operation_failed'));
    }
  };

  const handleUpdatePlan = async (formData: any) => {
    if (!editingPlan) return;

    try {
      await api.put(`/admin/plans/${editingPlan.id}`, formData);
      toast.success(t('messages.plan_updated'));
      setEditingPlan(null);
      fetchPlans();
    } catch (error) {
      console.error('Failed to update plan:', error);
      toast.error(t('messages.operation_failed'));
    }
  };

  const handleDeletePlan = async (plan: Plan) => {
    if (!confirm(`Are you sure you want to delete "${plan.name}"?`)) return;

    try {
      await api.delete(`/admin/plans/${plan.id}`);
      toast.success(t('messages.plan_deleted'));
      fetchPlans();
    } catch (error) {
      console.error('Failed to delete plan:', error);
      toast.error(t('messages.operation_failed'));
    }
  };

  const handleDragStart = (e: React.DragEvent, plan: Plan) => {
    setDraggedPlan(plan);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetPlan: Plan) => {
    e.preventDefault();
    
    if (!draggedPlan || draggedPlan.id === targetPlan.id) {
      setDraggedPlan(null);
      return;
    }

    try {
      // Create new order array
      const plansCopy = [...(plans?.data || [])];
      const draggedIndex = plansCopy.findIndex(p => p.id === draggedPlan.id);
      const targetIndex = plansCopy.findIndex(p => p.id === targetPlan.id);
      
      // Remove dragged item and insert at target position
      plansCopy.splice(draggedIndex, 1);
      plansCopy.splice(targetIndex, 0, draggedPlan);
      
      // Update sort orders
      const reorderData = plansCopy.map((plan, index) => ({
        id: plan.id,
        sort_order: index + 1
      }));

      await api.post('/admin/plans/reorder', { plans: reorderData });
      toast.success(t('messages.plans_reordered'));
      fetchPlans();
    } catch (error) {
      console.error('Failed to reorder plans:', error);
      toast.error(t('messages.operation_failed'));
    } finally {
      setDraggedPlan(null);
    }
  };

  const handleViewPlanDetails = (plan: Plan) => {
    setSelectedPlan(plan);
    setActiveTab('details');
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('plans.title')}</h1>
          <p className="text-muted-foreground">{t('plans.subtitle')}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('plans.add_plan')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Plan List</TabsTrigger>
          {selectedPlan && (
            <>
              <TabsTrigger value="details">
                {selectedPlan.name} - Details
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <ChartBarIcon className="h-4 w-4 mr-1" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="tenants">
                <UserGroupIcon className="h-4 w-4 mr-1" />
                Tenant Assignment
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tenants.filters')}</CardTitle>
              <CardDescription>Search and filter plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Search plans..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="active">Active Plans</SelectItem>
                    <SelectItem value="inactive">Inactive Plans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Plans Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('plans.plan_list')}</CardTitle>
              <CardDescription>
                {plans ? `${plans.total} total plans` : 'Loading plans...'} - Drag and drop to reorder
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!plans ? (
                <div className="flex items-center justify-center h-64">
                  <Alert className="max-w-md">
                    <AlertDescription>
                      {t('messages.error_occurred')}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"><div></div></TableHead>
                      <TableHead>{t('plans.plan_name')}</TableHead>
                      <TableHead>{t('plans.price')}</TableHead>
                      <TableHead>{t('plans.billing_cycle')}</TableHead>
                      <TableHead>{t('plans.features')}</TableHead>
                      <TableHead>{t('plans.tenant_count')}</TableHead>
                      <TableHead>{t('status.active')}</TableHead>
                      <TableHead className="text-right">{t('tenants.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.data.map((plan) => (
                      <TableRow 
                        key={plan.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, plan)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, plan)}
                        className={`cursor-move ${draggedPlan?.id === plan.id ? 'opacity-50' : ''}`}
                      >
                        <TableCell>
                          <Bars3Icon className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{plan.name}</div>
                            {plan.description && (
                              <div className="text-sm text-muted-foreground">{plan.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${plan.price}</div>
                          {plan.trial_days && plan.trial_days > 0 && (
                            <div className="text-sm text-muted-foreground">
                              {plan.trial_days} day trial
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <BillingCycleBadge cycle={plan.billing_cycle} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {plan.features.slice(0, 3).map((feature) => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {plan.features.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{plan.features.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-medium">{plan.tenants_count || 0}</div>
                            <div className="text-sm text-muted-foreground">tenants</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                            {plan.is_active ? t('status.active') : t('status.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                {t('tenants.actions')}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewPlanDetails(plan)}>
                                {t('actions.view')} Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingPlan(plan)}>
                                {t('actions.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeletePlan(plan)}
                                className="text-destructive"
                              >
                                {t('actions.delete')}
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
          {plans && plans.last_page > 1 && (
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div className="text-sm text-muted-foreground">
                  Showing {plans.from} to {plans.to} of {plans.total} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPlans(plans.current_page - 1)}
                    disabled={plans.current_page === 1}
                  >
                    {t('actions.previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPlans(plans.current_page + 1)}
                    disabled={plans.current_page === plans.last_page}
                  >
                    {t('actions.next')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {selectedPlan && (
          <>
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedPlan.name} - Plan Details</CardTitle>
                  <CardDescription>Comprehensive plan information and configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Plan Name</Label>
                        <p className="text-lg">{selectedPlan.name}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedPlan.description || 'No description provided'}
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Pricing</Label>
                        <p className="text-lg font-semibold">
                          ${selectedPlan.price} / {selectedPlan.billing_cycle}
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Trial Period</Label>
                        <p>{selectedPlan.trial_days || 0} days</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Features</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedPlan.features.map((feature) => (
                            <Badge key={feature} variant="outline">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Limits</Label>
                        <div className="space-y-2 mt-2">
                          {Object.entries(selectedPlan.limits).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="capitalize">{key.replace('_', ' ')}</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-2">
                          <Badge variant={selectedPlan.is_active ? 'default' : 'secondary'}>
                            {selectedPlan.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <PlanAnalyticsView plan={selectedPlan} />
            </TabsContent>

            <TabsContent value="tenants">
              <TenantAssignmentView plan={selectedPlan} />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Create Plan Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('plans.create_plan')}</DialogTitle>
            <DialogDescription>
              Create a new subscription plan
            </DialogDescription>
          </DialogHeader>
          <PlanForm
            onSave={handleCreatePlan}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Plan Modal */}
      <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('plans.edit_plan')}</DialogTitle>
            <DialogDescription>
              Update plan: {editingPlan?.name}
            </DialogDescription>
          </DialogHeader>
          {editingPlan && (
            <PlanForm
              plan={editingPlan}
              onSave={handleUpdatePlan}
              onCancel={() => setEditingPlan(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}