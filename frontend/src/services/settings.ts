import api from '../lib/api';

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  language: 'en' | 'ar';
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface BusinessInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  tax_id: string;
  currency: string;
  timezone: string;
}

export const settingsService = {
  /**
   * Get authenticated user's profile information
   */
  async getProfile(): Promise<ProfileData> {
    const response = await api.get('/business/settings/profile');
    return response.data;
  },

  /**
   * Update authenticated user's profile
   */
  async updateProfile(data: ProfileData): Promise<ProfileData> {
    const response = await api.put('/business/settings/profile', data);
    return response.data.data;
  },

  /**
   * Change user password
   */
  async changePassword(data: PasswordChangeData): Promise<void> {
    await api.post('/business/settings/password', data);
  },

  /**
   * Get business information for authenticated user's tenant
   */
  async getBusinessInfo(): Promise<BusinessInfo> {
    const response = await api.get('/business/settings/business');
    return response.data;
  },

  /**
   * Update business information (business owners only)
   */
  async updateBusinessInfo(data: BusinessInfo): Promise<BusinessInfo> {
    const response = await api.put('/business/settings/business', data);
    return response.data.data;
  },
};
