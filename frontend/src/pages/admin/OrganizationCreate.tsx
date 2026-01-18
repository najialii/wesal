import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeftIcon, 
  BuildingOfficeIcon,
  UserIcon,
  CreditCardIcon,
  InformationCircleIcon,
  KeyIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TextField, SelectField, PasswordField } from '@/components/ui/form-fields';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import api from '../../lib/api';
import PasswordManagementModal from '../../components/modals/PasswordManagementModal';
import FileUpload from '../../components/ui/FileUpload';

const organizationCreateSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255, 'Name must be less than 255 characters'),
  domain: z.string().min(1, 'Domain is required').max(100, 'Domain must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Domain can only contain lowercase letters, numbers, and hyphens'),
  admin_name: z.string().min(1, 'Admin name is required').max(255, 'Name must be less than 255 characters'),
  admin_email: z.string().email('Please enter a valid email address'),
  admin_password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  plan_id: z.string().min(1, 'Please select a plan'),
});

type OrganizationCreateFormData = z.infer<typeof organizationCreateSchema>;

export default function OrganizationCreate() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Array<{ id: number; name: string; price: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const form = useForm<OrganizationCreateFormData>({
    resolver: zodResolver(organizationCreateSchema),
    defaultValues: {
      name: '',
      domain: '',
      admin_name: '',
      admin_email: '',
      admin_password: '',
      plan_id: '',
    },
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  // Watch organization name and auto-generate domain
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name' && value.name) {
        // Auto-generate domain from organization name
        const generatedDomain = value.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
        
        if (generatedDomain && generatedDomain !== form.getValues('domain')) {
          form.setValue('domain', generatedDomain);
        }
      }
      
      // Clean domain field
      if (name === 'domain' && value.domain) {
        const cleanDomain = value.domain.toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (cleanDomain !== value.domain) {
          form.setValue('domain', cleanDomain);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/admin/plans');
      setPlans(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      toast.error('Failed to load subscription plans');
    }
  };

  const handleSubmit = async (data: OrganizationCreateFormData) => {
    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('domain', data.domain);
      formData.append('admin_name', data.admin_name);
      formData.append('admin_email', data.admin_email);
      if (data.admin_password) {
        formData.append('admin_password', data.admin_password);
      }
      formData.append('plan_id', data.plan_id);
      
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const response = await api.post('/admin/organizations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const passwordUsed = data.admin_password || response.data.admin_user.default_password;
      toast.success(`Organization created successfully! Admin password: ${passwordUsed}`);
      navigate(`/admin/organizations/${response.data.id}`);
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create organization';
      toast.error(errorMessage);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach((field) => {
          form.setError(field as keyof OrganizationCreateFormData, {
            message: errors[field][0],
          });
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = async (): Promise<string> => {
    // Generate a random password locally
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  };

  const handleSavePassword = async (password: string) => {
    form.setValue('admin_password', password);
  };

  const planOptions = plans.map(plan => ({
    value: plan.id.toString(),
    label: `${plan.name} - $${plan.price}/month`,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/tenants')}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Organization</h1>
            <p className="text-muted-foreground">Set up a new organization with admin account and subscription plan</p>
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
                  placeholder="Auto-generated from organization name"
                  required
                  description="Subdomain for organization access (auto-generated, but can be customized)"
                />
                <div className="text-sm text-muted-foreground">
                  Full URL will be: <span className="font-mono">{form.watch('domain') || '[domain]'}.wesaltech.com</span>
                </div>
              </div>

              <FileUpload
                onFileSelect={setLogoFile}
                onFileRemove={() => setLogoFile(null)}
                accept="image/*"
                maxSize={5}
                label="Organization Logo"
                description="Upload a logo for the organization (PNG, JPG, GIF up to 5MB)"
                preview={true}
              />
            </CardContent>
          </Card>

          {/* Admin Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Administrator Account
              </CardTitle>
              <CardDescription>
                Create the primary administrator account for this organization
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
                  label="Admin Password"
                  placeholder="Leave empty for default password (password123)"
                  description="Custom password for the admin account. Leave empty to use default password."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPasswordModalOpen(true)}
                  className="w-full"
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Generate & Set Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCardIcon className="h-5 w-5 mr-2" />
                Subscription Plan
              </CardTitle>
              <CardDescription>
                Choose the subscription plan for this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SelectField
                form={form}
                name="plan_id"
                label="Plan"
                placeholder="Select a subscription plan"
                options={planOptions}
                required
                description="Choose the subscription plan for this organization"
              />
            </CardContent>
          </Card>

          {/* Setup Notice */}
          <Alert>
            <InformationCircleIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Organization Setup:</strong> After creation, the organization will be set up with:
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Isolated database and data</li>
                <li>Admin account with full permissions (default password: <strong>password123</strong>)</li>
                <li>Active subscription based on selected plan</li>
                <li>Access via the specified subdomain</li>
                <li>Users should change their password after first login</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/admin/tenants')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !form.formState.isValid}
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Password Management Modal */}
      <PasswordManagementModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Generate Admin Password"
        description="Generate a secure password for the organization administrator"
        currentPassword={form.watch('admin_password')}
        onGeneratePassword={handleGeneratePassword}
        onSavePassword={handleSavePassword}
        showSaveButton={true}
      />
    </div>
  );
}