import api from '../lib/api';

// Offline cache for technician data
const CACHE_KEYS = {
  DASHBOARD: 'technician_dashboard',
  TODAY_VISITS: 'technician_today_visits',
  VISITS: 'technician_visits',
  PRODUCTS: 'technician_products',
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class OfflineCache {
  private isOnline = navigator.onLine;
  private pendingActions: Array<() => Promise<any>> = [];

  constructor() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline() {
    this.isOnline = true;
    this.syncPendingActions();
  }

  private handleOffline() {
    this.isOnline = false;
  }

  private async syncPendingActions() {
    while (this.pendingActions.length > 0) {
      const action = this.pendingActions.shift();
      if (action) {
        try {
          await action();
        } catch (error) {
          console.error('Failed to sync pending action:', error);
          this.pendingActions.unshift(action);
          break;
        }
      }
    }
  }

  set<T>(key: string, data: T): void {
    const cacheItem: CacheItem<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  }

  get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const isExpired = Date.now() - cacheItem.timestamp > CACHE_DURATION;
      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }
      return cacheItem.data;
    } catch {
      return null;
    }
  }

  queueAction(action: () => Promise<any>): void {
    this.pendingActions.push(action);
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }
}

const offlineCache = new OfflineCache();

export interface TechnicianVisit {
  id: number;
  scheduled_date: string;
  scheduled_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'missed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  work_description?: string;
  completion_notes?: string;
  total_cost?: number;
  customer: {
    id: number;
    name: string;
    phone?: string;
    address?: string;
    email?: string;
  };
  contract?: {
    id: number;
    frequency: string;
    customer?: {
      name: string;
      phone?: string;
      address?: string;
      email?: string;
    };
    customer_name?: string;
    customer_phone?: string;
    customer_address?: string;
  };
  branch?: {
    id: number;
    name: string;
    code?: string;
  };
  products?: Array<{
    id: number;
    name: string;
    sku: string;
    pivot: {
      quantity: number;
      unit_cost: number;
      total_cost: number;
    };
  }>;
}

export interface DashboardStats {
  today_visits_count: number;
  completed_today: number;
  pending_today: number;
  in_progress: number;
  next_visit?: TechnicianVisit;
  today_visits: TechnicianVisit[];
}

export interface CompleteVisitData {
  completion_notes: string;
  products?: Array<{
    product_id: number;
    quantity: number;
  }>;
}

export const technicianService = {
  async getDashboard(): Promise<DashboardStats> {
    try {
      const response = await api.get('/technician/dashboard');
      offlineCache.set(CACHE_KEYS.DASHBOARD, response.data);
      return response.data;
    } catch (error) {
      if (!offlineCache.getIsOnline()) {
        const cachedData = offlineCache.get<DashboardStats>(CACHE_KEYS.DASHBOARD);
        if (cachedData) return cachedData;
      }
      throw error;
    }
  },

  async getVisits(filters?: { status?: string; start_date?: string; end_date?: string }) {
    try {
      const response = await api.get('/technician/visits', { params: filters });
      offlineCache.set(CACHE_KEYS.VISITS, response.data);
      return response.data;
    } catch (error) {
      if (!offlineCache.getIsOnline()) {
        const cachedData = offlineCache.get(CACHE_KEYS.VISITS);
        if (cachedData) return cachedData;
      }
      throw error;
    }
  },

  async getTodayVisits() {
    try {
      const response = await api.get('/technician/visits/today');
      offlineCache.set(CACHE_KEYS.TODAY_VISITS, response.data);
      return response.data;
    } catch (error) {
      if (!offlineCache.getIsOnline()) {
        const cachedData = offlineCache.get(CACHE_KEYS.TODAY_VISITS);
        if (cachedData) return cachedData;
      }
      throw error;
    }
  },

  async getVisit(id: number): Promise<TechnicianVisit> {
    const response = await api.get(`/technician/visits/${id}`);
    return response.data;
  },

  async startVisit(id: number) {
    if (!offlineCache.getIsOnline()) {
      offlineCache.queueAction(async () => {
        await api.post(`/technician/visits/${id}/start`);
      });
      return { message: 'Visit start queued for sync when online' };
    }
    const response = await api.post(`/technician/visits/${id}/start`);
    return response.data;
  },

  async completeVisit(id: number, data: CompleteVisitData) {
    if (!offlineCache.getIsOnline()) {
      offlineCache.queueAction(async () => {
        await api.post(`/technician/visits/${id}/complete`, data);
      });
      return { message: 'Visit completion queued for sync when online' };
    }
    const response = await api.post(`/technician/visits/${id}/complete`, data);
    return response.data;
  },

  async getProducts(search?: string, lowStock?: boolean) {
    try {
      const response = await api.get('/technician/products', {
        params: { search, low_stock: lowStock },
      });
      offlineCache.set(CACHE_KEYS.PRODUCTS, response.data);
      return response.data;
    } catch (error) {
      if (!offlineCache.getIsOnline()) {
        const cachedData = offlineCache.get(CACHE_KEYS.PRODUCTS);
        if (cachedData) return cachedData;
      }
      throw error;
    }
  },

  async getHistory(filters?: { start_date?: string; end_date?: string; search?: string }) {
    const response = await api.get('/technician/history', { params: filters });
    return response.data;
  },

  async getMetrics(startDate?: string, endDate?: string) {
    const response = await api.get('/technician/metrics', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  isOnline(): boolean {
    return offlineCache.getIsOnline();
  },

  clearCache(): void {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
