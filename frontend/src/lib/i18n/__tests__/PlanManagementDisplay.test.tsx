import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TranslationProvider } from '../TranslationProvider';
import Plans from '../../../pages/admin/Plans';

// Mock the auth service
vi.mock('../../../services/auth', () => ({
  authService: {
    getCurrentUser: () => ({ id: 1, name: 'Admin', role: 'super_admin' }),
    isAuthenticated: () => true,
  },
}));

// Mock API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <TranslationProvider>
      {children}
    </TranslationProvider>
  </BrowserRouter>
);

const mockPlansData = {
  data: [
    {
      id: 1,
      name: 'Basic Plan',
      description: 'Perfect for small businesses getting started',
      price: 29.99,
      billing_cycle: 'monthly',
      features: ['pos', 'inventory', 'basic_reports'],
      max_users: 5,
      max_storage: 1024,
      is_popular: false,
      is_free: false,
      trial_days: 14,
      active_subscriptions: 25,
      total_revenue: 749.75,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      name: 'Professional Plan',
      description: 'Advanced features for growing businesses',
      price: 79.99,
      billing_cycle: 'monthly',
      features: ['pos', 'inventory', 'advanced_reports', 'multi_user', 'api_access'],
      max_users: 25,
      max_storage: 5120,
      is_popular: true,
      is_free: false,
      trial_days: 14,
      active_subscriptions: 15,
      total_revenue: 1199.85,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-20T14:45:00Z'
    },
    {
      id: 3,
      name: 'Free Plan',
      description: 'Try our platform with basic features',
      price: 0.00,
      billing_cycle: 'monthly',
      features: ['pos_basic'],
      max_users: 1,
      max_storage: 256,
      is_popular: false,
      is_free: true,
      trial_days: 0,
      active_subscriptions: 150,
      total_revenue: 0.00,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ],
  meta: {
    total: 3,
    per_page: 10,
    current_page: 1,
    last_page: 1
  }
};

describe('Property 5: Plan Management Displays Complete Plan Information', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPlansData),
    });
  });

  it('should display all essential plan information in the list view', async () => {
    render(
      <TestWrapper>
        <Plans />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Basic Plan')).toBeInTheDocument();
    });

    // Property: All plans should display complete information
    mockPlansData.data.forEach(plan => {
      // Plan name should be visible
      expect(screen.getByText(plan.name)).toBeInTheDocument();
      
      // Plan description should be visible
      expect(screen.getByText(plan.description)).toBeInTheDocument();
      
      // Price should be displayed with proper formatting
      if (plan.is_free) {
        expect(screen.getByText(/free/i)).toBeInTheDocument();
      } else {
        expect(screen.getByText(`$${plan.price}`)).toBeInTheDocument();
      }
      
      // Billing cycle should be shown
      expect(screen.getByText(new RegExp(plan.billing_cycle, 'i'))).toBeInTheDocument();
      
      // User and storage limits should be displayed
      expect(screen.getByText(new RegExp(`${plan.max_users}.*users?`, 'i'))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`${plan.max_storage}.*MB`, 'i'))).toBeInTheDocument();
    });
  });

  it('should display plan features in an organized manner', async () => {
    render(
      <TestWrapper>
        <Plans />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Basic Plan')).toBeInTheDocument();
    });

    // Property: Plan features should be clearly displayed and organized
    mockPlansData.data.forEach(plan => {
      plan.features.forEach(feature => {
        // Features should be displayed (may be in tooltips or expandable sections)
        const featureElements = screen.getAllByText(new RegExp(feature.replace('_', ' '), 'i'));
        expect(featureElements.length).toBeGreaterThan(0);
      });
    });

    // Popular plans should be highlighted
    const popularPlan = mockPlansData.data.find(p => p.is_popular);
    if (popularPlan) {
      expect(screen.getByText(/popular/i)).toBeInTheDocument();
    }
  });

  it('should display subscription and revenue metrics for each plan', async () => {
    render(
      <TestWrapper>
        <Plans />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Basic Plan')).toBeInTheDocument();
    });

    // Property: Subscription metrics should be visible for business insights
    mockPlansData.data.forEach(plan => {
      // Active subscriptions count
      expect(screen.getByText(new RegExp(`${plan.active_subscriptions}.*subscriptions?`, 'i'))).toBeInTheDocument();
      
      // Revenue information (except for free plans)
      if (!plan.is_free) {
        expect(screen.getByText(new RegExp(`\\$${plan.total_revenue}`, 'i'))).toBeInTheDocument();
      }
    });
  });

  it('should provide clear visual hierarchy and status indicators', async () => {
    render(
      <TestWrapper>
        <Plans />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Basic Plan')).toBeInTheDocument();
    });

    // Property: Visual hierarchy should make plan comparison easy
    
    // Free plans should be clearly marked
    const freePlan = mockPlansData.data.find(p => p.is_free);
    if (freePlan) {
      expect(screen.getByText(freePlan.name)).toBeInTheDocument();
      expect(screen.getByText(/free/i)).toBeInTheDocument();
    }

    // Popular plans should have special styling/badges
    const popularPlan = mockPlansData.data.find(p => p.is_popular);
    if (popularPlan) {
      expect(screen.getByText(popularPlan.name)).toBeInTheDocument();
      // Should have popular badge or special styling
      const popularBadge = screen.getByText(/popular/i);
      expect(popularBadge).toBeInTheDocument();
    }

    // Trial information should be displayed
    mockPlansData.data.forEach(plan => {
      if (plan.trial_days > 0) {
        expect(screen.getByText(new RegExp(`${plan.trial_days}.*day.*trial`, 'i'))).toBeInTheDocument();
      }
    });
  });

  it('should display plan management actions and controls', async () => {
    render(
      <TestWrapper>
        <Plans />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Basic Plan')).toBeInTheDocument();
    });

    // Property: Management actions should be easily accessible
    
    // Create new plan button should be visible
    expect(screen.getByRole('button', { name: /create.*plan/i })).toBeInTheDocument();

    // Each plan should have action buttons/menu
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    expect(editButtons.length).toBeGreaterThan(0);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Should have bulk actions for multiple plan management
    expect(screen.getByRole('button', { name: /bulk.*actions/i })).toBeInTheDocument();
  });

  it('should display plan creation and modification timestamps', async () => {
    render(
      <TestWrapper>
        <Plans />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Basic Plan')).toBeInTheDocument();
    });

    // Property: Timestamps should provide audit trail information
    mockPlansData.data.forEach(plan => {
      // Created date should be visible (may be in tooltip or details)
      const createdDate = new Date(plan.created_at).toLocaleDateString();
      const createdElements = screen.getAllByText(new RegExp(createdDate));
      
      // Updated date should be visible for recently modified plans
      if (plan.created_at !== plan.updated_at) {
        const updatedDate = new Date(plan.updated_at).toLocaleDateString();
        const updatedElements = screen.getAllByText(new RegExp(updatedDate));
        expect(updatedElements.length).toBeGreaterThan(0);
      }
    });
  });

  it('should provide filtering and sorting capabilities', async () => {
    render(
      <TestWrapper>
        <Plans />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Basic Plan')).toBeInTheDocument();
    });

    // Property: Plans should be filterable and sortable for easy management
    
    // Search/filter input should be available
    expect(screen.getByPlaceholderText(/search.*plans?/i)).toBeInTheDocument();

    // Sorting options should be available
    expect(screen.getByRole('button', { name: /sort/i })).toBeInTheDocument();

    // Filter by plan type (free, paid, popular)
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
  });

  it('should handle empty state gracefully', async () => {
    // Mock empty response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [],
        meta: { total: 0, per_page: 10, current_page: 1, last_page: 1 }
      }),
    });

    render(
      <TestWrapper>
        <Plans />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/no plans found/i)).toBeInTheDocument();
    });

    // Property: Empty state should guide users to create their first plan
    expect(screen.getByText(/create your first plan/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create.*plan/i })).toBeInTheDocument();
  });

  it('should display plan comparison information', async () => {
    render(
      <TestWrapper>
        <Plans />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Basic Plan')).toBeInTheDocument();
    });

    // Property: Plans should be easily comparable
    
    // Price comparison should be clear
    const prices = mockPlansData.data.map(p => p.price);
    prices.forEach(price => {
      if (price > 0) {
        expect(screen.getByText(`$${price}`)).toBeInTheDocument();
      }
    });

    // Feature comparison should be available
    expect(screen.getByRole('button', { name: /compare.*plans?/i })).toBeInTheDocument();

    // Usage limits should be clearly displayed for comparison
    mockPlansData.data.forEach(plan => {
      expect(screen.getByText(new RegExp(`${plan.max_users}.*users?`, 'i'))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`${plan.max_storage}.*MB`, 'i'))).toBeInTheDocument();
    });
  });
});