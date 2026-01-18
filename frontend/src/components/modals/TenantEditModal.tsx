import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormModal } from '@/components/ui/form-modal'
import { Form } from '@/components/ui/form'
import { TextField, SelectField } from '@/components/ui/form-fields'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { Tenant } from '@/types'

const tenantEditSchema = z.object({
  name: z.string().min(1, 'Tenant name is required').max(255, 'Name must be less than 255 characters'),
  domain: z.string().min(1, 'Domain is required').max(100, 'Domain must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Domain can only contain lowercase letters, numbers, and hyphens'),
  plan_id: z.string().min(1, 'Please select a plan'),
  status: z.enum(['active', 'suspended', 'cancelled'], {
    required_error: 'Please select a status',
  }),
})

type TenantEditFormData = z.infer<typeof tenantEditSchema>

interface TenantEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tenant: Tenant | null
}

export function TenantEditModal({
  isOpen,
  onClose,
  onSuccess,
  tenant,
}: TenantEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<Array<{ id: number; name: string; price: number }>>([])

  const form = useForm<TenantEditFormData>({
    resolver: zodResolver(tenantEditSchema),
    defaultValues: {
      name: '',
      domain: '',
      plan_id: '',
      status: 'active',
    },
  })

  // Fetch plans and populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPlans()
      if (tenant) {
        form.reset({
          name: tenant.name,
          domain: tenant.domain,
          plan_id: tenant.plan_id?.toString() || '',
          status: tenant.status as 'active' | 'suspended' | 'cancelled',
        })
      }
    }
  }, [isOpen, tenant])

  const fetchPlans = async () => {
    try {
      const response = await api.get('/admin/plans')
      setPlans(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      toast.error('Failed to load subscription plans')
    }
  }

  const handleSubmit = async (data: TenantEditFormData) => {
    if (!tenant) return

    try {
      setLoading(true)
      await api.put(`/admin/tenants/${tenant.id}`, {
        name: data.name,
        domain: data.domain,
        plan_id: parseInt(data.plan_id),
        status: data.status,
      })
      
      toast.success('Tenant updated successfully')
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Failed to update tenant:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update tenant'
      toast.error(errorMessage)
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        Object.keys(errors).forEach((field) => {
          form.setError(field as keyof TenantEditFormData, {
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

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Tenant"
      description="Update tenant information and subscription settings"
      size="lg"
      onSubmit={form.handleSubmit(handleSubmit)}
      loading={loading}
      submitText="Update Tenant"
      submitDisabled={!form.formState.isValid}
    >
      <Form {...form}>
          <div className="space-y-4">
            {/* Tenant Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Tenant Information</h3>
              
              <TextField
                form={form}
                name="name"
                label="Tenant Name"
                placeholder="Enter tenant/company name"
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

            {/* Subscription Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Subscription Management</h3>
              
              <SelectField
                form={form}
                name="plan_id"
                label="Subscription Plan"
                placeholder="Select a subscription plan"
                options={planOptions}
                required
                description="Choose the subscription plan for this tenant"
              />

              <SelectField
                form={form}
                name="status"
                label="Tenant Status"
                placeholder="Select tenant status"
                options={statusOptions}
                required
                description="Active tenants can access the system, suspended tenants are temporarily blocked"
              />
            </div>

            {/* Status Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Status Effects</h4>
              <div className="text-sm text-gray-600">
                {form.watch('status') === 'active' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tenant can access the system normally</li>
                    <li>All features and data are available</li>
                    <li>Billing is active</li>
                  </ul>
                )}
                {form.watch('status') === 'suspended' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tenant access is temporarily blocked</li>
                    <li>Data is preserved but inaccessible</li>
                    <li>Billing may be paused</li>
                    <li>Can be reactivated at any time</li>
                  </ul>
                )}
                {form.watch('status') === 'cancelled' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tenant account is permanently closed</li>
                    <li>Access is completely blocked</li>
                    <li>Data may be scheduled for deletion</li>
                    <li>Billing is stopped</li>
                  </ul>
                )}
              </div>
            </div>

            {/* Tenant Details */}
            {tenant && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Tenant Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tenant ID:</span>
                    <div className="font-medium">#{tenant.id}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <div className="font-medium">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <div className="font-medium">
                      {new Date(tenant.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Plan:</span>
                    <div className="font-medium">
                      {tenant.plan?.name || 'No Plan'} 
                      {tenant.plan && ` ($${tenant.plan.price}/month)`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warning for Status Changes */}
            {form.watch('status') !== 'active' && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Status Change Warning
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Changing the tenant status will immediately affect their access to the system. 
                        Make sure you understand the implications before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Form>
    </FormModal>
  )
}