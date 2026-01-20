import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeftIcon, 
  BuildingOfficeIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  UserIcon,
  KeyIcon,

} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField, SelectField, PasswordField } from '@/components/ui/form-fields';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { Tenant } from '../../types';
import PasswordManagementModal from '../../components/modals/PasswordManagementModal';
import FileUpload from '../../components/ui/FileUpload';

const organizationEditSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255, 'Name must be less than 255 characters'),
  domain: z.string().min(1, 'Domain is required').max(100, 'Domain must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Domain can only contain lowercase letters, numbers, and hyphens'),
  admin_name: z.string().min(1, 'Admin name is required').max(255, 'Name must be less than 255 characters'),
  admin_email: z.string().email('Please enter a valid email address'),
  admin_password: z.string().optional(),
  plan_id: z.string().min(1, 'Please select a plan'),
  status: z.enum(['active', 'suspended', 'cancelled'], {
    required_error: 'Please select a status',
  }),
});

type OrganizationEditFormData = z.infer<typeof organizationEditSchema>;

export default function OrganizationEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Tenant | null>(null);
  const [plans, setPlans] = useState<Array<{ id: number; name: string; price: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const form = useForm<OrganizationEditFormData>({
    resolver: zodResolver(organizationEditSchema),
    defaultValues: {
      name: '',
      domain: '',
      admin_name: '',
      admin_email: '',
      admin_password: '',
      plan_id: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (!id || id === 'undefined') {
      console.error('Invalid organization ID:', id);
      toast.error('Invalid organization ID');
      navigate('/admin/tenants');
      return;
    }
    fetchData();
  }, [id, navigate]);

  const fetchData = async () => {
    if (!id || id === 'undefined') {
      console.error('Cannot fetch data: Invalid organization ID');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching organization data for ID:', id);
      
      const [orgResponse, plansResponse] = await Promise.all([
        api.get(`/admin/tenants/${id}`),
        api.get('/admin/plans')
      ]);
      
      const orgData = orgResponse.data;
      console.log('Organization data received:', orgData);
      
      setOrganization(orgData);
      setPlans(plansResponse.data.data || []);
      
      // Populate form with organization data
      const formData = {
        name: orgData.name || '',
        domain: orgData.domain || '',
        admin_name: orgData.admin?.name || '',
        admin_email: orgData.admin?.email || '',
        admin_password: '', // Never populate password field
        plan_id: orgData.plan_id?.toString() || '',
        status: (orgData.status as 'active' | 'suspended' | 'cancelled') || 'active',
      };
      
      console.log('Setting form data:', formData);
      form.reset(formData);
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load organization details');
      navigate('/admin/tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: OrganizationEditFormData) => {
    if (!organization) return;

    try {
      setSaving(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('domain', data.domain);
      formData.append('admin_name', data.admin_name);
      formData.append('admin_email', data.admin_email);
      formData.append('plan_id', data.plan_id);
      formData.append('status', data.status);

      // Only include password if it's provided
      if (data.admin_password && data.admin_password.trim()) {
        formData.append('admin_password', data.admin_password);
      }

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      if (removeLogo) {
        formData.append('remove_logo', 'true');
      }

      await api.post(`/admin/tenants/${organization.id}?_method=PUT`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('Organization updated successfully');
      navigate(`/admin/organizations/${organization.id}`);
    } catch (error: any) {
      console.error('Failed to update organization:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update organization';
      toast.error(errorMessage);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach((field) => {
          form.setError(field as keyof OrganizationEditFormData, {
            message: errors[field][0],
          });
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePassword = async (): Promise<string> => {
    if (!organization) throw new Error('No organization selected');
    
    const response = await api.post(`/admin/tenants/${organization.id}/reset-admin-password`);
    return response.data.new_password;
  };

  const handleSavePassword = async (password: string) => {
    form.setValue('admin_password', password);
  };

  const planOptions = plans.map(plan => ({
    value: plan.id.toString(),
    label: `${plan.name} - $${plan.price}/month`,
  }));

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

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
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
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
            Organization not found or you don't have permission to edit it.
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
          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/organizations/${organization.id}`)}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Details
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Organization</h1>
            <p className="text-muted-foreground">{organization.name}</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Organization Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                Organization Information
              </CardTitle>
              <CardDescription>
                Basic information about the organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextField
                form={form}
                name="name"
                label="Organization Name"
                placeholder="Enter organization/company name"
                required
                description="The name of the business or organization"
              />

              <div className="space-y-2">
                <TextField
                  form={form}
                  name="domain"
                  label="Domain"
                  placeholder="Enter subdomain"
                  required
                  description="Subdomain for organization access (e.g., 'acme' for acme.yourdomain.com)"
                />
                <div className="text-sm text-muted-foreground">
                  Full URL will be: <span className="font-mono">{form.watch('domain') || '[domain]'}.yourdomain.com</span>
                </div>
              </div>

              <FileUpload
                onFileSelect={(file) => {
                  setLogoFile(file);
                  setRemoveLogo(false);
                }}
                onFileRemove={() => {
                  setLogoFile(null);
                  setRemoveLogo(true);
                }}
                currentFile={organization?.logo_url}
                accept="image/*"
                maxSize={5}
                label="Organization Logo"
                description="Upload a new logo or remove the current one (PNG, JPG, GIF up to 5MB)"
                preview={true}
              />
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCardIcon className="h-5 w-5 mr-2" />
                Subscription Management
              </CardTitle>
              <CardDescription>
                Manage the organization's subscription plan and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SelectField
                form={form}
                name="plan_id"
                label="Subscription Plan"
                placeholder="Select a subscription plan"
                options={planOptions}
                required
                description="Choose the subscription plan for this organization"
              />

              <SelectField
                form={form}
                name="status"
                label="Organization Status"
                placeholder="Select organization status"
                options={statusOptions}
                required
                description="Active organizations can access the system, suspended organizations are temporarily blocked"
              />
            </CardContent>
          </Card>

          {/* Admin Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Administrator Account
              </CardTitle>
              <CardDescription>
                Update the primary administrator account for this organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextField
                form={form}
                name="admin_name"
                label="Admin Name"
                placeholder="Enter admin full name"
                required
                description="Name of the organization administrator"
              />
              
              <TextField
                form={form}
                name="admin_email"
                label="Admin Email"
                type="email"
                placeholder="Enter admin email address"
                required
                description="Email address for the organization administrator"
              />
              
              <div className="space-y-2">
                <PasswordField
                  form={form}
                  name="admin_password"
                  label="New Admin Password"
                  placeholder="Leave empty to keep current password"
                  description="Enter a new password to change the admin password, or leave empty to keep current password"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPasswordModalOpen(true)}
                  className="w-full"
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Generate & Set New Password
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                <strong>Note:</strong> Changing the admin email will update the login credentials. 
                Setting a new password will immediately change the admin's login password.
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card>
            <CardHeader>
              <CardTitle>Status Effects</CardTitle>
              <CardDescription>
                Understand what each status means for the organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {form.watch('status') === 'active' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Organization can access the system normally</li>
                    <li>All features and data are available</li>
                    <li>Billing is active</li>
                  </ul>
                )}
                {form.watch('status') === 'suspended' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Organization access is temporarily blocked</li>
                    <li>Data is preserved but inaccessible</li>
                    <li>Billing may be paused</li>
                    <li>Can be reactivated at any time</li>
                  </ul>
                )}
                {form.watch('status') === 'cancelled' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Organization account is permanently closed</li>
                    <li>Access is completely blocked</li>
                    <li>Data may be scheduled for deletion</li>
                    <li>Billing is stopped</li>
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Organization Details */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                System information and metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Organization ID:</span>
                  <div className="font-medium">#{organization.id}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <div className="font-medium">
                    {organization.created_at ? new Date(organization.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <div className="font-medium">
                    {organization.updated_at ? new Date(organization.updated_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Plan:</span>
                  <div className="font-medium">
                    {organization.plan?.name || 'No Plan'} 
                    {organization.plan && ` ($${organization.plan.price}/month)`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning for Status Changes */}
          {form.watch('status') !== 'active' && (
            <Alert>
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>Status Change Warning:</strong> Changing the organization status will immediately affect their access to the system. 
                Make sure you understand the implications before proceeding.
              </AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/admin/organizations/${organization.id}`)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saving || !form.formState.isValid}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Password Management Modal */}
      <PasswordManagementModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Generate New Admin Password"
        description={`Generate a new password for ${organization?.name || 'this organization'}'s administrator`}
        currentPassword={form.watch('admin_password')}
        onGeneratePassword={handleGeneratePassword}
        onSavePassword={handleSavePassword}
        showSaveButton={true}
      />
    </div>
  );
}