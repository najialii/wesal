import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormModal } from '@/components/ui/form-modal'
import { Form } from '@/components/ui/form'
import { TextField, SelectField } from '@/components/ui/form-fields'
import { toast } from 'sonner'
import api from '@/lib/api'

const staffEditSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['tenant_admin', 'manager', 'salesman'], {
    required_error: 'Please select a role',
  }),
  is_active: z.boolean().default(true),
})

type StaffEditFormData = z.infer<typeof staffEditSchema>

interface StaffMember {
  id: number
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface StaffEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staffId: number | null
}

export function StaffEditModal({
  isOpen,
  onClose,
  onSuccess,
  staffId,
}: StaffEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null)

  const form = useForm<StaffEditFormData>({
    resolver: zodResolver(staffEditSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'salesman',
      is_active: true,
    },
  })

  // Fetch staff member data when modal opens and staffId is provided
  useEffect(() => {
    if (isOpen && staffId) {
      fetchStaffMember()
    }
  }, [isOpen, staffId])

  const fetchStaffMember = async () => {
    if (!staffId) return

    try {
      setFetchingData(true)
      const response = await api.get(`/tenant/staff/${staffId}`)
      const staff = response.data.data
      setStaffMember(staff)
      
      // Pre-populate form with existing data
      form.reset({
        name: staff.name,
        email: staff.email,
        role: staff.role,
        is_active: staff.is_active,
      })
    } catch (error) {
      console.error('Failed to fetch staff member:', error)
      toast.error('Failed to load staff member data')
      handleClose()
    } finally {
      setFetchingData(false)
    }
  }

  const handleSubmit = async (data: StaffEditFormData) => {
    if (!staffId) return

    try {
      setLoading(true)
      await api.put(`/tenant/staff/${staffId}`, {
        name: data.name,
        email: data.email,
        role: data.role,
        is_active: Boolean(data.is_active),
      })
      
      toast.success('Staff member updated successfully')
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Failed to update staff member:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update staff member'
      toast.error(errorMessage)
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        Object.keys(errors).forEach((field) => {
          form.setError(field as keyof StaffEditFormData, {
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
    setStaffMember(null)
    onClose()
  }

  const handlePasswordReset = async () => {
    if (!staffId || !staffMember) return

    try {
      await api.post(`/tenant/staff/${staffId}/reset-password`)
      toast.success('Password reset email sent successfully')
    } catch (error) {
      console.error('Failed to send password reset:', error)
      toast.error('Failed to send password reset email')
    }
  }

  const roleOptions = [
    { value: 'tenant_admin', label: 'Tenant Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'salesman', label: 'Salesman' },
  ]

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Staff Member"
      description="Update staff member information and permissions"
      size="lg"
      onSubmit={form.handleSubmit(handleSubmit)}
      loading={loading || fetchingData}
      submitText="Update Staff Member"
      submitDisabled={!form.formState.isValid || fetchingData}
    >
      {fetchingData ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading staff member data...</span>
        </div>
      ) : (
        <Form {...form}>
          <div className="space-y-4">
            {/* Staff Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Staff Information</h3>
              
              <TextField
                form={form}
                name="name"
                label="Full Name"
                placeholder="Enter staff member's full name"
                required
                description="The full name of the staff member"
              />

              <TextField
                form={form}
                name="email"
                label="Email Address"
                type="email"
                placeholder="Enter email address"
                required
                description="Email address used for login and notifications"
              />

              <SelectField
                form={form}
                name="role"
                label="Role"
                placeholder="Select a role"
                options={roleOptions}
                required
                description="The role determines the staff member's permissions and access level"
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  {...form.register('is_active')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <p className="text-sm text-gray-500">
                  Active staff members can log in and access the system
                </p>
                {form.formState.errors.is_active && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.is_active.message}
                  </p>
                )}
              </div>
            </div>

            {/* Role Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Role Permissions</h4>
              <div className="text-sm text-gray-600">
                {form.watch('role') === 'tenant_admin' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Full access to all tenant features</li>
                    <li>Can manage staff members and roles</li>
                    <li>Can view and modify all business data</li>
                    <li>Can access tenant settings and configuration</li>
                  </ul>
                )}
                {form.watch('role') === 'manager' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Can manage products, sales, and maintenance</li>
                    <li>Can view reports and analytics</li>
                    <li>Can manage staff members (limited)</li>
                    <li>Cannot access tenant settings</li>
                  </ul>
                )}
                {form.watch('role') === 'salesman' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Can process sales and manage POS</li>
                    <li>Can view assigned maintenance tasks</li>
                    <li>Can update product inventory</li>
                    <li>Cannot manage other staff members</li>
                  </ul>
                )}
              </div>
            </div>

            {/* Password Reset */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-800">
                    Password Reset
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      To reset this staff member's password, click the button below. 
                      They will receive an email with instructions to set a new password.
                    </p>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm font-medium px-3 py-2 rounded-md transition-colors"
                    >
                      Send Password Reset Email
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Member Info */}
            {staffMember && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Staff Member Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Member Since:</span>
                    <div className="font-medium">
                      {new Date(staffMember.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <div className="font-medium">
                      {new Date(staffMember.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Form>
      )}
    </FormModal>
  )
}