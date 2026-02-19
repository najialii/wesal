import api from '../lib/api';
import type { User } from '../types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  company_name?: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('=== LOGIN DEBUG ===');
      console.log('Email:', credentials.email);
      console.log('Password length:', credentials.password?.length);
      console.log('Password:', credentials.password); // Temporary debug
      console.log('API URL:', api.defaults.baseURL);
      console.log('Full credentials object:', JSON.stringify(credentials));
      
      const response = await api.post('/auth/login', credentials);
      const { user, token } = response.data;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('Login successful');
      return { user, token };
    } catch (error: any) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Full error:', error);
      throw error;
    }
  },

  async register(credentials: RegisterCredentials): Promise<LoginResponse> {
    try {
      console.log('Attempting registration with:', { 
        name: credentials.name, 
        email: credentials.email,
        company_name: credentials.company_name 
      });
      
      const response = await api.post('/auth/register', credentials);
      const { user, token } = response.data;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('Registration successful');
      return { user, token };
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  async googleAuth(googleUser: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
  }): Promise<LoginResponse> {
    try {
      console.log('[v2] Attempting Google auth with:', { 
        google_id: googleUser.id,
        email: googleUser.email, 
        name: googleUser.name,
        avatar: googleUser.picture 
      });
      
      const response = await api.post('/auth/google', {
        google_id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        given_name: googleUser.given_name,
        family_name: googleUser.family_name,
      });
      
      const { user, token } = response.data;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('Google auth successful');
      return { user, token };
    } catch (error: any) {
      console.error('Google auth failed:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  async refreshUser(): Promise<User> {
    try {
      const response = await api.get('/auth/me');
      const { user } = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.is_super_admin || false;
  }
};