import { useState, useEffect } from 'react';
import { 
  BuildingStorefrontIcon, 
  UserCircleIcon, 
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import { authService } from '../../services/auth';
import { settingsService, ProfileData, PasswordChangeData, BusinessInfo } from '../../services/settings';
import { toast } from 'sonner';
import { calculatePasswordStrength, getStrengthColor } from '../../lib/passwordStrength';

type TabType = 'business' | 'account' | 'notifications' | 'preferences';

export default function Settings() {
  const { t: tSettings } = useTranslation('settings');
  const { changeLanguage, currentLanguage } = useTranslation('common');
  const { isRTL } = useDirectionClasses();
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = authService.getCurrentUser();
  
  // Check if user is business owner (support both role formats)
  const isBusinessOwner = user?.roles?.some((r: any) => r.name === 'business_owner') || user?.role === 'business_owner';

  // Account Settings State (Profile)
  const [accountSettings, setAccountSettings] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    language: 'en',
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  // Password strength
  const passwordStrength = passwordData.new_password 
    ? calculatePasswordStrength(passwordData.new_password)
    : null;

  // Business Settings State
  const [businessSettings, setBusinessSettings] = useState<BusinessInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    tax_id: '',
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
  });

  // Logo state
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);

  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
  }, []);

  // Load business data when business tab is active
  useEffect(() => {
    if (activeTab === 'business') {
      loadBusinessData();
    }
  }, [activeTab]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const profile = await settingsService.getProfile();
      setAccountSettings(profile);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      const business = await settingsService.getBusinessInfo();
      setBusinessSettings(business);
      // Store logo separately
      if ((business as any).logo_url || (business as any).logo) {
        setBusinessLogo((business as any).logo_url || (business as any).logo);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updatedProfile = await settingsService.updateProfile(accountSettings);
      setAccountSettings(updatedProfile);
      
      // Update language if changed
      if (updatedProfile.language !== currentLanguage) {
        await changeLanguage(updatedProfile.language);
        toast.success('Profile and language updated successfully! Reloading page...');
        // Reload page to apply language changes throughout the app
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      if (errors) {
        Object.values(errors).flat().forEach((err: any) => toast.error(err));
      } else {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSaving(true);
      await settingsService.changePassword(passwordData);
      
      // Clear password fields
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
      
      toast.success('Password changed successfully!');
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      if (errors) {
        Object.values(errors).flat().forEach((err: any) => toast.error(err));
      } else {
        toast.error(error.response?.data?.message || 'Failed to change password');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    try {
      setSaving(true);
      const updatedBusiness = await settingsService.updateBusinessInfo(businessSettings);
      setBusinessSettings(updatedBusiness);
      toast.success('Business information updated successfully!');
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      if (errors) {
        Object.values(errors).flat().forEach((err: any) => toast.error(err));
      } else {
        toast.error(error.response?.data?.message || 'Failed to update business information');
      }
    } finally {
      setSaving(false);
    }
  };

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    salesNotifications: true,
    inventoryAlerts: true,
    maintenanceReminders: true,
    staffUpdates: false,
    marketingEmails: false,
  });

  const tabs = [
    { id: 'business' as TabType, name: tSettings('tabs.business'), icon: BuildingStorefrontIcon },
    { id: 'account' as TabType, name: tSettings('tabs.account'), icon: UserCircleIcon },
    { id: 'notifications' as TabType, name: tSettings('tabs.notifications'), icon: BellIcon },
    { id: 'preferences' as TabType, name: tSettings('tabs.preferences'), icon: Cog6ToothIcon },
  ];

  return (
    <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{tSettings('title')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {tSettings('subtitle')}
        </p>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Horizontal Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {/* Business Info Tab */}
          {activeTab === 'business' && (
            <div className="p-8">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">{tSettings('messages.loadingBusiness')}</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Logo Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      {tSettings('business.logo')}
                    </label>
                    <div className="flex items-center gap-6">
                      {businessLogo ? (
                        <img 
                          src={businessLogo} 
                          alt="Business Logo" 
                          className="h-24 w-24 object-contain rounded-xl border-2 border-gray-200 bg-white p-2"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            setBusinessLogo(null);
                          }}
                        />
                      ) : (
                        <div className="h-24 w-24 bg-white rounded-xl border-2 border-gray-200 flex items-center justify-center">
                          <BuildingStorefrontIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{businessSettings.name || 'Your Business'}</p>
                        <p className="text-sm text-gray-500 mt-1">{tSettings('business.logoDescription')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">{tSettings('business.title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('business.name')}
                        </label>
                        <input
                          type="text"
                          value={businessSettings.name}
                          onChange={(e) => setBusinessSettings({ ...businessSettings, name: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          disabled={!isBusinessOwner}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('business.email')}
                        </label>
                        <input
                          type="email"
                          value={businessSettings.email}
                          onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          disabled={!isBusinessOwner}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('business.phone')}
                        </label>
                        <input
                          type="tel"
                          value={businessSettings.phone}
                          onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          disabled={!isBusinessOwner}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('business.taxId')}
                        </label>
                        <input
                          type="text"
                          value={businessSettings.tax_id}
                          onChange={(e) => setBusinessSettings({ ...businessSettings, tax_id: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          disabled={!isBusinessOwner}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('business.address')}
                        </label>
                        <input
                          type="text"
                          value={businessSettings.address}
                          onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          disabled={!isBusinessOwner}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('business.city')}
                        </label>
                        <input
                          type="text"
                          value={businessSettings.city}
                          onChange={(e) => setBusinessSettings({ ...businessSettings, city: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          disabled={!isBusinessOwner}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('business.country')}
                        </label>
                        <input
                          type="text"
                          value={businessSettings.country}
                          onChange={(e) => setBusinessSettings({ ...businessSettings, country: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          disabled={!isBusinessOwner}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('business.currency')}
                        </label>
                        <select
                          value={businessSettings.currency}
                          onChange={(e) => setBusinessSettings({ ...businessSettings, currency: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          disabled={!isBusinessOwner}
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="SAR">SAR - Saudi Riyal</option>
                          <option value="AED">AED - UAE Dirham</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('business.timezone')}
                        </label>
                        <select
                          value={businessSettings.timezone}
                          onChange={(e) => setBusinessSettings({ ...businessSettings, timezone: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          disabled={!isBusinessOwner}
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                          <option value="Asia/Dubai">Dubai</option>
                          <option value="Asia/Riyadh">Riyadh</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {!isBusinessOwner && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-amber-800">
                        {tSettings('business.readOnlyNotice')}
                      </p>
                    </div>
                  )}

                  {/* Save Button */}
                  {isBusinessOwner && (
                    <div className="flex justify-end pt-6 border-t border-gray-200">
                      <button
                        onClick={handleSaveBusiness}
                        disabled={saving || loading}
                        className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                      >
                        {saving ? tSettings('buttons.saving') : tSettings('buttons.save')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="p-8">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">{tSettings('messages.loadingProfile')}</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">{tSettings('account.personalInfo')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('account.fullName')}
                        </label>
                        <input
                          type="text"
                          value={accountSettings.name}
                          onChange={(e) => setAccountSettings({ ...accountSettings, name: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('account.email')}
                        </label>
                        <input
                          type="email"
                          value={accountSettings.email}
                          onChange={(e) => setAccountSettings({ ...accountSettings, email: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('account.phone')}
                        </label>
                        <input
                          type="tel"
                          value={accountSettings.phone || ''}
                          onChange={(e) => setAccountSettings({ ...accountSettings, phone: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('account.language')}
                        </label>
                        <select
                          value={accountSettings.language}
                          onChange={(e) => setAccountSettings({ ...accountSettings, language: e.target.value as 'en' | 'ar' })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        >
                          <option value="en">English</option>
                          <option value="ar">العربية</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('account.role')}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-700">
                          {user?.roles && user.roles.length > 0 ? (
                            <>
                              {user.roles[0].name === 'business_owner' && (tSettings('account.roles.business_owner') || 'Business Owner')}
                              {user.roles[0].name === 'business_admin' && (tSettings('account.roles.business_admin') || 'Business Admin')}
                              {user.roles[0].name === 'salesman' && (tSettings('account.roles.salesman') || 'Salesman')}
                              {user.roles[0].name === 'tenant_admin' && (tSettings('account.roles.business_admin') || 'Business Admin')}
                              {user.roles[0].name === 'manager' && (tSettings('account.roles.manager') || 'Manager')}
                              {user.roles[0].name === 'technician' && (tSettings('account.roles.technician') || 'Technician')}
                            </>
                          ) : (
                            user?.role === 'business_owner' ? (tSettings('account.roles.business_owner') || 'Business Owner') :
                            user?.role === 'business_admin' ? (tSettings('account.roles.business_admin') || 'Business Admin') :
                            user?.role === 'salesman' ? (tSettings('account.roles.salesman') || 'Salesman') :
                            tSettings('account.roles.business_owner') || 'Business Owner'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Profile Button */}
                  <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving || loading}
                      className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                    >
                      {saving ? tSettings('buttons.saving') : tSettings('buttons.save')}
                    </button>
                  </div>

                  {/* Change Password Section */}
                  <div className="pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">{tSettings('account.changePassword')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('account.currentPassword')}
                        </label>
                        <input
                          type="password"
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('account.newPassword')}
                        </label>
                        <input
                          type="password"
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          {tSettings('account.passwordHint')}
                        </p>
                        {passwordStrength && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${getStrengthColor(passwordStrength.strength)}`}
                                  style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                />
                              </div>
                              <span className={`text-xs font-semibold ${
                                passwordStrength.strength === 'weak' ? 'text-red-600' :
                                passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {tSettings(`passwordStrength.${passwordStrength.strength}`)}
                              </span>
                            </div>
                            {passwordStrength.feedback.length > 0 && (
                              <ul className="text-xs text-gray-600 space-y-1">
                                {passwordStrength.feedback.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span className="text-gray-400">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {tSettings('account.confirmPassword')}
                        </label>
                        <input
                          type="password"
                          value={passwordData.new_password_confirmation}
                          onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handleChangePassword}
                        disabled={saving || !passwordData.current_password || !passwordData.new_password || !passwordData.new_password_confirmation}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                      >
                        {saving ? tSettings('buttons.changingPassword') : tSettings('account.changePasswordButton')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{tSettings('notifications.title')}</h3>
              <div className="space-y-1">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {tSettings(`notifications.${key}`)}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {tSettings(`notifications.${key}Desc`)}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, [key]: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{tSettings('preferences.title')}</h3>
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tSettings('preferences.dateFormat')}
                  </label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tSettings('preferences.timeFormat')}
                  </label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors">
                    <option>12-hour (AM/PM)</option>
                    <option>24-hour</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tSettings('preferences.numberFormat')}
                  </label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors">
                    <option>1,234.56</option>
                    <option>1.234,56</option>
                    <option>1 234,56</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
