import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormModal } from '@/components/ui/form-modal'
import { Form } from '@/components/ui/form'
import { TextField, SelectField, PasswordField } from '@/components/ui/form-fields'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import api from '@/lib/api'

const staffCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  role: z.enum(['tenant_admin', 'manager', 'salesman'], {
    required_error: 'Please select a role',
  }),
})

type StaffCreateFormData = z.infer<typeof staffCreateSchema>

interface StaffCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function StaffCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: StaffCreateModalProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<StaffCreateFormData>({
    resolver: zodResolver(staffCreateSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      role: undefined,
    },
  })

  const generatePassword = () => {
    // Generate a secure password with uppercase, lowercase, numbers, and symbols
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*'
    const allChars = uppercase + lowercase + numbers + symbols
    
    let password = ''
    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]
    
    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('')
    
    form.setValue('password', password)
    toast.success('Password generated successfully')
  }

  const handleSubmit = async (data: StaffCreateFormData) => {
    try {
      setLoading(true)
      
      await api.post('/tenant/staff', {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || null,
        role: data.role,
      })

      toast.success('Staff member created successfully')
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Failed to create staff member:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create staff member'
      toast.error(errorMessage)
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        Object.keys(errors).forEach((field) => {
          form.setError(field as keyof StaffCreateFormData, {
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

  const roleOptions = [
    { value: 'tenant_admin', label: 'Tenant Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'salesman', label: 'Salesman' },
  ]

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Staff Member"
      description="Create a new staff member account with appropriate role and permissions"
      size="lg"
      onSubmit={form.handleSubmit(handleSubmit)}
      loading={loading}
      submitText="Create Staff Member"
      submitDisabled={!form.formState.isValid}
    >
      <Form {...form}>
        <div className="space-y-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
            
            <TextField
              form={form}
              name="name"
              label="Full Name"
              placeholder="Enter staff member's full name"
              required
            />

            <TextField
              form={form}
              name="email"
              label="Email Address"
              type="email"
              placeholder="Enter email address"
              required
              description="Must be unique - will be used for login"
            />

            <TextField
              form={form}
              name="phone"
              label="Phone Number"
              type="tel"
              placeholder="Enter phone number (optional)"
              description="Optional - used for contact and notifications"
            />
          </div>

          {/* Account Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
            
            <SelectField
              form={form}
              name="role"
              label="Role"
              placeholder="Select a role"
              options={roleOptions}
              required
              description="Determines the permissions and access level for this staff member"
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePassword}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Generate
                </Button>
              </div>
              
              <PasswordField
                form={form}
                name="password"
                label=""
                placeholder="Enter a secure password"
                required
                description="Minimum 8 characters. Use the generate button for a secure password."
              />
            </div>
          </div>

          {/* Role Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Role Permissions</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>Tenant Admin:</strong> Full access to all features and settings</div>
              <div><strong>Manager:</strong> Access to staff management and business operations</div>
              <div><strong>Salesman:</strong> Access to sales, customers, and inventory</div>
            </div>
          </div>

          {/* Invitation Notice */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Account Invitation
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    The staff member will receive login credentials and can start using the system immediately.
                    They will be prompted to change their password on first login.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </FormModal>
  )
}