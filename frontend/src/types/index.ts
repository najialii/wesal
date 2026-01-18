export interface User {
  id: number;
  name: string;
  email: string;
  is_super_admin: boolean;
  tenant_id?: number;
  tenant?: Tenant;
  avatar?: string;
  phone?: string;
  timezone: string;
  last_login_at?: string;
  role?: string; // Add role property for compatibility
  roles?: Array<{ name: string }>;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  limits: Record<string, number>;
  is_active: boolean;
  trial_days: number;
  sort_order: number;
  tenants_count?: number;
  subscriptions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo?: string;
  logo_url?: string;
  database_name?: string;
  database?: string; // Add database property for compatibility
  plan_id?: number;
  status: 'active' | 'suspended' | 'cancelled';
  settings?: Record<string, any>;
  trial_ends_at?: string;
  subscription_ends_at?: string;
  created_by?: number;
  admin?: { // Add admin property
    name: string;
    email: string;
  };
  plan?: Plan;
  creator?: User;
  subscriptions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  tenant_id: string;
  plan_id: number;
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  starts_at: string;
  ends_at?: string;
  trial_ends_at?: string;
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  tenant?: Tenant;
  plan?: Plan;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  overview: {
    total_tenants: number;
    active_tenants: number;
    total_users: number;
    total_revenue: number;
    monthly_revenue: number;
  };
  revenue: {
    monthly: Array<{
      month: number;
      year: number;
      total: number;
    }>;
    by_plan: Array<{
      name: string;
      total: number;
    }>;
  };
  growth: {
    tenants: Array<{
      date: string;
      count: number;
    }>;
    users: Array<{
      date: string;
      count: number;
    }>;
  };
  recent_activity: {
    tenants: Tenant[];
    subscriptions: Subscription[];
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}