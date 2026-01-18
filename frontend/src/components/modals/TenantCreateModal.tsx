import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormModal } from '@/components/ui/form-modal'
import { Form } from '@/components/ui/form'
import { TextField, SelectField } from '@/components/ui/form-fields'
import { toast } from 'sonner'
import api from '@/lib/api'

const tenantCreateSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255, 'Name must be less than 255 characters'),
  domain: z.string().min(1, 'Domain is required').max(100, 'Domain must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Domain can only contain lowercase letters, numbers, and hyphens'),
  admin_name: z.string().min(1, 'Admin name is required').max(255, 'Name must be less than 255 characters'),
  admin_email: z.string().email('Please enter a valid email address'),
  plan_id: z.string().min(1, 'Please select a plan'),
})

type TenantCreateFormData = z.infer<typeof tenantCreateSchema>

interface TenantCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TenantCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: TenantCreateModalProps) {
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<Array<{ id: number; name: string; price: number }>>([])

  const form = useForm<TenantCreateFormData>({
    resolver: zodResolver(tenantCreateSchema),
    defaultValues: {
      name: '',
      domain: '',
      admin_name: '',
      admin_email: '',
      plan_id: '',
    },
  })

  // Fetch plans when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPlans()
    }
  }, [isOpen])

  // Watch domain field and clean it
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'domain' && value.domain) {
        const cleanDomain = value.domain.toLowerCase().replace(/[^a-z0-9-]/g, '')
        if (cleanDomain !== value.domain) {
          form.setValue('domain', cleanDomain)
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const fetchPlans = async () => {
    try {
      const response = await api.get('/admin/plans')
      setPlans(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      toast.error('Failed to load subscription plans')
    }
  }

  const handleSubmit = async (data: TenantCreateFormData) => {
    try {
      setLoading(true)
      await api.post('/admin/tenants', {
        name: data.name,
        domain: data.domain,
        admin_name: data.admin_name,
        admin_email: data.admin_email,
        plan_id: parseInt(data.plan_id),
      })
      toast.success('Organization created successfully')
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Failed to create tenant:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create organization'
      toast.error(errorMessage)
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        Object.keys(errors).forEach((field) => {
          form.setError(field as keyof TenantCreateFormData, {
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
    onClose()
  }

  const planOptions = plans.map(plan => ({
    value: plan.id.toString(),
    label: `${plan.name} - $${plan.price}/month`,
  }))

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Organization"
      description="Set up a new organization with admin account and subscription plan"
      size="md"
      onSubmit={form.handleSubmit(handleSubmit)}
      loading={loading}
      submitText="Create Organization"
      submitDisabled={!form.formState.isValid}
    >
      <Form {...form}>
        <div className="space-y-4">
          {/* Organization Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Organization Information</h3>
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
                description="Subdomain for tenant access (e.g., 'acme' for acme.yourdomain.com)"
              />
              <div className="text-sm text-gray-500">
                Full URL will be: <span className="font-mono">{form.watch('domain') || '[domain]'}.yourdomain.com</span>
              </div>
            </div>
          </div>

          {/* Admin Account */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Admin Account</h3>
            <TextField
              form={form}
              name="admin_name"
              label="Admin Name"
              placeholder="Enter admin full name"
              required
              description="Name of the tenant administrator"
            />
            <TextField
              form={form}
              name="admin_email"
              label="Admin Email"
              type="email"
              placeholder="Enter admin email address"
              required
              description="Email address for the tenant administrator (used for login)"
            />
          </div>

          {/* Subscription Plan */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Subscription Plan</h3>
            <SelectField
              form={form}
              name="plan_id"
              label="Plan"
              placeholder="Select a subscription plan"
              options={planOptions}
              required
              description="Choose the subscription plan for this tenant"
            />
          </div>

          {/* Setup Notice */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Tenant Setup
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    After creation, the tenant will be set up with:
                  </p>
                  <ul className="mt-1 list-disc list-inside">
                    <li>Isolated database and data</li>
                    <li>Admin account with full permissions</li>
                    <li>Active subscription based on selected plan</li>
                    <li>Access via the specified subdomain</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </FormModal>
  )
}