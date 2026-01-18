import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  PauseIcon,
  PlayIcon,
  BuildingOfficeIcon,
  UserIcon,
  CreditCardIcon,
  CalendarIcon,
  GlobeAltIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { Tenant } from '../../types';
import PasswordManagementModal from '../../components/modals/PasswordManagementModal';

const StatusBadge = ({ status }: { status: string | undefined }) => {
  const variants = {
    active: 'default' as const,
    suspended: 'secondary' as const,
    cancelled: 'destructive' as const,
  };

  // Handle undefined or null status
  if (!status) {
    return (
      <Badge variant="secondary">
        Unknown
      </Badge>
    );
  }

  return (
    <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default function OrganizationView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      console.log('OrganizationView: Loading organization with ID:', id);
      fetchOrganization();
    } else {
      console.error('OrganizationView: No ID provided');
      navigate('/admin/tenants');
    }
  }, [id, navigate]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      console.log('Fetching organization data for ID:', id);
      const response = await api.get(`/admin/tenants/${id}`);
      console.log('Organization data received:', response.data);
      setOrganization(response.data);
    } catch (error) {
      console.error('Failed to fetch organization:', error);
      toast.error('Failed to load organization details');
      navigate('/admin/tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!organization) return;
    
    try {
      setActionLoading(true);
      await api.post(`/admin/tenants/${organization.id}/suspend`);
      toast.success('Organization suspended successfully');
      fetchOrganization();
    } catch (error) {
      console.error('Failed to suspend organization:', error);
      toast.error('Failed to suspend organization');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!organization) return;
    
    try {
      setActionLoading(true);
      await api.post(`/admin/tenants/${organization.id}/activate`);
      toast.success('Organization activated successfully');
      fetchOrganization();
    } catch (error) {
      console.error('Failed to activate organization:', error);
      toast.error('Failed to activate organization');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!organization) return;
    
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await api.delete(`/admin/tenants/${organization.id}`);
      toast.success('Organization deleted successfully');
      navigate('/admin/tenants');
    } catch (error) {
      console.error('Failed to delete organization:', error);
      toast.error('Failed to delete organization');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!organization) return;
    setPasswordModalOpen(true);
  };

  const handleGeneratePassword = async (): Promise<string> => {
    if (!organization) throw new Error('No organization selected');
    
    const response = await api.post(`/admin/tenants/${organization.id}/reset-admin-password`);
    return response.data.new_password;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertDescription>
            Organization not found or you do not have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/tenants')}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
          <div className="flex items-center space-x-4">
            {/* Organization Logo */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              <img
                src={organization.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(organization.name)}&color=7F9CF5&background=EBF4FF&size=200`}
                alt={`${organization.name} logo`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to generated avatar if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(organization.name)}&color=7F9CF5&background=EBF4FF&size=200`;
                }}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
              <p className="text-muted-foreground">Organization Details</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {organization.status === 'active' ? (
            <Button 
              variant="outline" 
              onClick={handleSuspend}
              disabled={actionLoading}
            >
              <PauseIcon className="h-4 w-4 mr-2" />
              Suspend
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleActivate}
              disabled={actionLoading}
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              Activate
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleResetPassword}
            disabled={actionLoading}
          >
            <KeyIcon className="h-4 w-4 mr-2" />
            Manage Admin Password
          </Button>
          
          <Button 
            variant="outline" 
            asChild
          >
            <Link to={`/admin/organizations/${organization.id}/edit`}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={actionLoading}
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Organization Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              Organization Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-lg font-medium">{organization.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Domain</label>
              <p className="text-lg font-medium flex items-center">
                <GlobeAltIcon className="h-4 w-4 mr-2" />
                {organization.domain}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <StatusBadge status={organization?.status} />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-lg font-medium flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {organization.created_at ? new Date(organization.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCardIcon className="h-5 w-5 mr-2" />
              Subscription Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Current Plan</label>
              <p className="text-lg font-medium">
                {organization.plan?.name || 'No Plan Assigned'}
              </p>
            </div>
            
            {organization.plan && (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Monthly Cost</label>
                  <p className="text-lg font-medium">${organization.plan.price}/month</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Features</label>
                  <p className="text-sm text-muted-foreground">
                    {organization.plan.description || 'Standard features included'}
                  </p>
                </div>
              </>
            )}
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <p className="text-lg font-medium">
                {organization.updated_at ? new Date(organization.updated_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Administrator Information
          </CardTitle>
          <CardDescription>
            Primary administrator account for this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Admin Name</label>
              <p className="text-lg font-medium">
                {organization.admin?.name || 'Not specified'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Admin Email</label>
              <p className="text-lg font-medium">
                {organization.admin?.email || 'Not specified'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Technical details and system identifiers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Organization ID</label>
              <p className="text-lg font-medium font-mono">#{organization.id}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Database</label>
              <p className="text-lg font-medium">
                {organization.database || `tenant_${organization.id}`}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full URL</label>
              <p className="text-lg font-medium">
                {organization.domain}.yourdomain.com
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Management Modal */}
      <PasswordManagementModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Manage Admin Password"
        description={`Generate or reset the admin password for ${organization?.name || 'this organization'}`}
        onGeneratePassword={handleGeneratePassword}
      />
    </div>
  );
}