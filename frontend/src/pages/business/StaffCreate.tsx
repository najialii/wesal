import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeftIcon, 
  BuildingStorefrontIcon, 
  UserIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  WrenchScrewdriverIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { Form } from '@/components/ui/form';
import { TextField, SelectField, PasswordField } from '@/components/ui/form-fields';
import { toast } from 'sonner';
import api from '../../lib/api';
import { useTranslation } from '../../lib/i18n/TranslationProvider';
import { authService } from '../../services/auth';
import { useBranch } from '../../contexts/BranchContext';

const staffCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.string().min(1, 'Please select a role'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
  branch_ids: z.array(z.number()).optional(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords do not match",
  path: ["password_confirmation"],
});

type StaffCreateFormData = z.infer<typeof staffCreateSchema>;

export default function StaffCreate() {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation('staff');
  const { currentBranch } = useBranch();
  const [loading, setLoading] = useState(false);
  const [allowedRoles, setAllowedRoles] = useState<string[]>(['salesman', 'technician']);

  const form = useForm<StaffCreateFormData>({
    resolver: zodResolver(staffCreateSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'salesman',
      password: '',
      password_confirmation: '',
      branch_ids: [],
    },
  });

  const selectedRole = form.watch('role');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    if (currentUser?.role === 'super_admin' || currentUser?.roles?.some((r: any) => r.name === 'super_admin')) {
      setAllowedRoles(['business_owner', 'salesman', 'technician']);
    } else if (
      currentUser?.role === 'business_owner' ||
      currentUser?.roles?.some((r: any) => r.name === 'business_owner')
    ) {
      setAllowedRoles(['salesman', 'technician']);
      form.setValue('role', 'salesman');
    } else {
      setAllowedRoles(['salesman', 'technician']);
      form.setValue('role', 'salesman');
    }
  }, [form]);

  const handleSubmit = async (data: StaffCreateFormData) => {
    try {
      setLoading(true);
      
      if (!allowedRoles.includes(data.role)) {
        toast.error(t('validation.roleRestricted'));
        return;
      }

      await api.post('/tenant/staff', {
        name: data.name,
        email: data.email,
        role: data.role,
        password: data.password,
        password_confirmation: data.password_confirmation,
        branch_ids: currentBranch ? [currentBranch.id] : undefined,
      });
      
      toast.success(t('notifications.createSuccess'));
      navigate('/business/staff');
    } catch (error: any) {
      console.error('Failed to create staff member:', error);
      const errorMessage = error.response?.data?.message || t('notifications.createError');
      toast.error(errorMessage);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach((field) => {
          form.setError(field as keyof StaffCreateFormData, {
            message: errors[field][0],
          });
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    form.setValue('password', password);
    form.setValue('password_confirmation', password);
    toast.success(isRTL ? 'تم إنشاء كلمة المرور بنجاح' : 'Password generated successfully');
  };

  const getRoleOptions = () => {
    const allRoles = [
      { value: 'business_owner', label: t('roles.business_owner', { fallback: 'Business Owner' }) },
      { value: 'salesman', label: t('roles.salesman', { fallback: 'Salesman' }) },
      { value: 'technician', label: t('roles.technician', { fallback: 'Technician' }) },
    ];
    
    return allRoles.filter(role => allowedRoles.includes(role.value));
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'business_owner':
        return isRTL ? [
          'الوصول الكامل لجميع ميزات العمل',
          'إدارة جميع الموظفين',
          'عرض التقارير المالية',
          'إدارة إعدادات العمل',
        ] : [
          'Full access to all business features',
          'Can manage all staff members',
          'Can view financial reports',
          'Can manage business settings',
        ];
      case 'salesman':
        return isRTL ? [
          'معالجة المبيعات وإدارة نقاط البيع',
          'عرض مهام الصيانة المعينة',
          'تحديث مخزون المنتجات',
          'لا يمكن إدارة الموظفين الآخرين',
        ] : [
          'Can process sales and manage POS',
          'Can view assigned maintenance tasks',
          'Can update product inventory',
          'Cannot manage other staff members',
        ];
      case 'technician':
        return isRTL ? [
          'عرض مهام الصيانة المعينة',
          'تحديث حالة زيارات الصيانة',
          'إضافة ملاحظات وصور للزيارات',
          'لا يمكن الوصول لبيانات المبيعات',
        ] : [
          'Can view assigned maintenance tasks',
          'Can update maintenance visit status',
          'Can add notes and photos to visits',
          'Cannot access sales data',
        ];
      default:
        return [];
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'business_owner': return 'from-purple-500 to-indigo-600';
      case 'salesman': return 'from-green-500 to-emerald-600';
      case 'technician': return 'from-orange-500 to-amber-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'business_owner': 
        return <BriefcaseIcon className="h-6 w-6 text-purple-600" />;
      case 'salesman': 
        return <UserIcon className="h-6 w-6 text-green-600" />;
      case 'technician': 
        return <WrenchScrewdriverIcon className="h-6 w-6 text-orange-600" />;
      default: 
        return <UserIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/business/staff')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('modals.createTitle', { fallback: 'Add New Staff Member' })}
            </h1>
            <p className="text-gray-500 mt-1">
              {t('staffDescription', { fallback: 'Add a new team member to your business' })}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <h2 className={`text-lg font-semibold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <UserIcon className="h-5 w-5 text-gray-500" />
                    {isRTL ? 'المعلومات الشخصية' : 'Personal Information'}
                  </h2>
                </div>
                <div className="p-6 space-y-5">
                  <TextField
                    form={form}
                    name="name"
                    label={t('form.name', { fallback: 'Full Name' })}
                    placeholder={t('form.namePlaceholder', { fallback: 'Enter full name' })}
                    required
                  />
                  <TextField
                    form={form}
                    name="email"
                    label={t('form.email', { fallback: 'Email Address' })}
                    type="email"
                    placeholder={t('form.emailPlaceholder', { fallback: 'Enter email address' })}
                    required
                  />
                </div>
              </div>

              {/* Role Selection Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <h2 className={`text-lg font-semibold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <ShieldCheckIcon className="h-5 w-5 text-gray-500" />
                    {isRTL ? 'الدور والصلاحيات' : 'Role & Permissions'}
                  </h2>
                </div>
                <div className="p-6 space-y-5">
                  <SelectField
                    form={form}
                    name="role"
                    label={t('form.role', { fallback: 'Role' })}
                    placeholder={t('selectRole', { fallback: 'Select a role' })}
                    options={getRoleOptions()}
                    required
                  />
                  
                  {/* Role Permissions Preview */}
                  {selectedRole && (
                    <div className={`p-4 rounded-lg bg-gradient-to-r ${getRoleColor(selectedRole)} bg-opacity-10`} style={{ background: `linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))` }}>
                      <div className={`flex items-center gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          {getRoleIcon(selectedRole)}
                        </div>
                        <span className="font-medium text-gray-900">
                          {getRoleOptions().find(r => r.value === selectedRole)?.label}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {getRolePermissions(selectedRole).map((permission, index) => (
                          <li key={index} className={`flex items-start gap-2 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{permission}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <h2 className={`text-lg font-semibold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <LockClosedIcon className="h-5 w-5 text-gray-500" />
                    {isRTL ? 'أمان الحساب' : 'Account Security'}
                  </h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <PasswordField
                      form={form}
                      name="password"
                      label={isRTL ? 'كلمة المرور' : 'Password'}
                      placeholder={isRTL ? 'أدخل كلمة المرور' : 'Enter password'}
                      required
                    />
                    <PasswordField
                      form={form}
                      name="password_confirmation"
                      label={isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                      placeholder={isRTL ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
                      required
                    />
                  </div>
                  
                  {/* Password Generator */}
                  <button
                    type="button"
                    onClick={generatePassword}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg text-indigo-700 font-medium hover:from-indigo-100 hover:to-purple-100 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <SparklesIcon className="h-5 w-5" />
                    {isRTL ? 'إنشاء كلمة مرور آمنة' : 'Generate Secure Password'}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar - Right Side */}
            <div className="space-y-6">
              {/* Branch Assignment Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <h2 className={`text-lg font-semibold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <BuildingStorefrontIcon className="h-5 w-5 text-gray-500" />
                    {t('branchAssignment', { fallback: 'Branch Assignment' })}
                  </h2>
                </div>
                <div className="p-6">
                  {currentBranch ? (
                    <div className="space-y-4">
                      <div className={`flex items-center p-4 bg-indigo-50 border border-indigo-200 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center ${isRTL ? 'ml-4' : 'mr-4'}`}>
                          <BuildingStorefrontIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{currentBranch.name}</p>
                          <p className="text-sm text-gray-500">{currentBranch.code}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {isRTL 
                          ? 'سيتم تعيين الموظف لهذا الفرع تلقائياً.'
                          : 'Staff member will be assigned to this branch automatically.'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <BuildingStorefrontIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">
                        {isRTL ? 'الوصول لجميع الفروع' : 'Access to all branches'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Tips Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
                <h3 className={`font-semibold text-gray-900 mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <LightBulbIcon className="h-5 w-5 text-amber-500" />
                  {isRTL ? 'نصائح سريعة' : 'Quick Tips'}
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <CheckCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {isRTL 
                      ? 'استخدم بريد إلكتروني صالح للموظف'
                      : 'Use a valid email for the staff member'
                    }
                  </li>
                  <li className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <CheckCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {isRTL 
                      ? 'اختر الدور المناسب بناءً على المهام'
                      : 'Choose the appropriate role based on tasks'
                    }
                  </li>
                  <li className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <CheckCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {isRTL 
                      ? 'شارك بيانات الدخول مع الموظف بشكل آمن'
                      : 'Share login credentials securely'
                    }
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('saving', { fallback: 'Saving...' })}
                    </span>
                  ) : (
                    <span className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <UserIcon className="h-4 w-4" />
                      {isRTL ? 'إضافة الموظف' : 'Add Staff Member'}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/business/staff')}
                  disabled={loading}
                  className="w-full px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-all"
                >
                  {t('buttons.cancel', { fallback: 'Cancel' })}
                </button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
