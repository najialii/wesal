import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { Form } from '@/components/ui/form';
import { TextField, SelectField } from '@/components/ui/form-fields';
import { toast } from 'sonner';
import api from '../../lib/api';
import { useTranslation } from '../../lib/i18n/TranslationProvider';

interface Branch {
  id: number;
  name: string;
  code: string;
  is_default: boolean;
  is_active: boolean;
}

const staffEditSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.string().min(1, 'Please select a role'), // Allow any role string for backward compatibility
  is_active: z.boolean().default(true),
  branch_ids: z.array(z.number()).optional(),
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
  branches?: Branch[]
}

export default function StaffEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { t, isRTL } = useTranslation('staff')
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
      branch_ids: [],
    },
  })

  // Fetch staff member data when component mounts
  useEffect(() => {
    if (id) {
      fetchStaffMember()
    }
  }, [id])

  const fetchStaffMember = async () => {
    if (!id) return

    try {
      setFetchingData(true)
      const response = await api.get(`/tenant/staff/${id}`)
      const staff = response.data.data || response.data
      setStaffMember(staff)
      
      // Get role name from roles array
      const roleName = staff.roles && staff.roles.length > 0 ? staff.roles[0].name : staff.role || 'salesman'
      
      // Convert is_active to boolean (API might return 1/0 or "1"/"0")
      const isActive = staff.is_active === true || staff.is_active === 1 || staff.is_active === "1"
      
      // Pre-populate form with existing data
      form.reset({
        name: staff.name,
        email: staff.email,
        role: roleName,
        is_active: isActive,
        branch_ids: staff.branches ? staff.branches.map((b: Branch) => b.id) : [],
      })
    } catch (error) {
      console.error('Failed to fetch staff member:', error)
      toast.error('Failed to load staff member data')
      navigate('/business/staff')
    } finally {
      setFetchingData(false)
    }
  }

  const handleSubmit = async (data: StaffEditFormData) => {
    if (!id) return

    try {
      setLoading(true)
      await api.put(`/tenant/staff/${id}`, {
        name: data.name,
        email: data.email,
        role: data.role,
        is_active: Boolean(data.is_active),
        // Keep existing branch assignments
        branch_ids: staffMember?.branches ? staffMember.branches.map(b => b.id) : undefined,
      })
      
      toast.success('Staff member updated successfully')
      navigate('/business/staff')
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

  const handlePasswordReset = async () => {
    if (!id || !staffMember) return

    try {
      await api.post(`/tenant/staff/${id}/reset-password`)
      toast.success('Password reset email sent successfully')
    } catch (error) {
      console.error('Failed to send password reset:', error)
      toast.error('Failed to send password reset email')
    }
  }

  const roleOptions = [
    { value: 'business_owner', label: 'Business Owner' },
    { value: 'salesman', label: 'Salesman' },
    { value: 'technician', label: 'Technician' },
  ]

  if (fetchingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff member data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/business/staff')}
            className={`flex items-center text-gray-600 hover:text-gray-900 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <ArrowLeftIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('staff')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('modals.editTitle')}</h1>
          <p className="mt-2 text-gray-600">
            {t('staffDescription')}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow-lg rounded-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="p-8 space-y-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
              </div>

              {/* Role and Permissions */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Role and Permissions
                </h2>
                
                <div className="space-y-6">
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

                  {/* Role Information */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Role Permissions</h3>
                    <div className="text-sm text-gray-600">
                      {form.watch('role') === 'business_owner' && (
                        <ul className="list-disc list-inside space-y-2">
                          <li>Full access to all business features</li>
                          <li>Can manage all staff members</li>
                          <li>Can view financial reports</li>
                          <li>Can manage business settings</li>
                        </ul>
                      )}
                      {form.watch('role') === 'salesman' && (
                        <ul className="list-disc list-inside space-y-2">
                          <li>Can process sales and manage POS</li>
                          <li>Can view assigned maintenance tasks</li>
                          <li>Can update product inventory</li>
                          <li>Cannot manage other staff members</li>
                        </ul>
                      )}
                      {form.watch('role') === 'technician' && (
                        <ul className="list-disc list-inside space-y-2">
                          <li>Can view and perform maintenance tasks</li>
                          <li>Can update maintenance visit status</li>
                          <li>Can view products and inventory</li>
                          <li>Cannot manage sales or staff</li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch Assignment */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                  <BuildingStorefrontIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-500`} />
                  {t('branchAssignment') || 'Branch Assignment'}
                </h2>
                
                <div className="space-y-4">
                  {staffMember?.branches && staffMember.branches.length > 0 ? (
                    <div className="flex items-center p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <BuildingStorefrontIcon className={`h-8 w-8 text-indigo-500 ${isRTL ? 'ml-4' : 'mr-4'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {staffMember.branches[0].name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {staffMember.branches[0].code}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {isRTL ? 'الفرع المعين' : 'Assigned Branch'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                      <BuildingStorefrontIcon className={`h-8 w-8 text-gray-300 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                      <p>{isRTL ? 'لم يتم تعيين فرع' : 'No branch assigned'}</p>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-500">
                    {isRTL 
                      ? 'الفرع المعين لهذا الموظف. لتغيير الفرع، يرجى التواصل مع صاحب العمل.'
                      : 'The branch assigned to this staff member. To change, please contact the business owner.'
                    }
                  </p>
                </div>
              </div>

              {/* Password Reset */}
              <div className="bg-blue-50 p-6 rounded-lg">
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
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Staff Member Details</h3>
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

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/business/staff')}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update Staff Member'
                  )}
                </button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}