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
    // Listen for online/offline events
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
          // Re-add to queue if failed
          this.pendingActions.unshift(action);
          break;
        }
      }
    }
  }

  set<T>(key: string, data: T): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    };
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
    };
    customer_name?: string;
    customer_phone?: string;
    customer_address?: string;
  };
  branch?: {
    id: number;
    name: string;
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
  // Dashboard
  async getDashboard(): Promise<DashboardStats> {
    try {
      const response = await api.get('/technician/dashboard');
      const data = response.data;
      
      // Cache the data for offline use
      offlineCache.set(CACHE_KEYS.DASHBOARD, data);
      
      return data;
    } catch (error) {
      // Try to get cached data if offline
      if (!offlineCache.getIsOnline()) {
        const cachedData = offlineCache.get<DashboardStats>(CACHE_KEYS.DASHBOARD);
        if (cachedData) {
          return cachedData;
        }
      }
      throw error;
    }
  },

  // Visits
  async getVisits(filters?: { status?: string; start_date?: string; end_date?: string }) {
    try {
      const response = await api.get('/technician/visits', { params: filters });
      const data = response.data;
      
      // Cache visits data
      offlineCache.set(CACHE_KEYS.VISITS, data);
      
      return data;
    } catch (error) {
      if (!offlineCache.getIsOnline()) {
        const cachedData = offlineCache.get(CACHE_KEYS.VISITS);
        if (cachedData) {
          return cachedData;
        }
      }
      throw error;
    }
  },

  async getTodayVisits() {
    try {
      const response = await api.get('/technician/visits/today');
      const data = response.data;
      
      // Cache today's visits
      offlineCache.set(CACHE_KEYS.TODAY_VISITS, data);
      
      return data;
    } catch (error) {
      if (!offlineCache.getIsOnline()) {
        const cachedData = offlineCache.get(CACHE_KEYS.TODAY_VISITS);
        if (cachedData) {
          return cachedData;
        }
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
      // Queue action for when online
      offlineCache.queueAction(async () => {
        await api.post(`/technician/visits/${id}/start`);
      });
      
      // Return optimistic response
      return { message: 'Visit start queued for sync when online' };
    }
    
    const response = await api.post(`/technician/visits/${id}/start`);
    return response.data;
  },

  async completeVisit(id: number, data: CompleteVisitData) {
    if (!offlineCache.getIsOnline()) {
      // Queue action for when online
      offlineCache.queueAction(async () => {
        await api.post(`/technician/visits/${id}/complete`, data);
      });
      
      // Return optimistic response
      return { message: 'Visit completion queued for sync when online' };
    }
    
    const response = await api.post(`/technician/visits/${id}/complete`, data);
    return response.data;
  },

  // Products/Parts
  async getProducts(search?: string, lowStock?: boolean) {
    try {
      const response = await api.get('/technician/products', {
        params: { search, low_stock: lowStock },
      });
      const data = response.data;
      
      // Cache products data
      offlineCache.set(CACHE_KEYS.PRODUCTS, data);
      
      return data;
    } catch (error) {
      if (!offlineCache.getIsOnline()) {
        const cachedData = offlineCache.get(CACHE_KEYS.PRODUCTS);
        if (cachedData) {
          return cachedData;
        }
      }
      throw error;
    }
  },

  // History
  async getHistory(filters?: { start_date?: string; end_date?: string; search?: string }) {
    const response = await api.get('/technician/history', { params: filters });
    return response.data;
  },

  // Metrics
  async getMetrics(startDate?: string, endDate?: string) {
    const response = await api.get('/technician/metrics', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  // Offline status
  isOnline(): boolean {
    return offlineCache.getIsOnline();
  },

  // Clear cache
  clearCache(): void {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
