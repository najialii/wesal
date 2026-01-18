import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { MaintenanceContracts } from '../../pages/business/MaintenanceContracts';
import { MaintenanceContractForm } from '../../pages/business/MaintenanceContractForm';
import { TechnicianDashboard } from '../../pages/technician/Dashboard';
import { TranslationProvider } from '../../lib/i18n/TranslationProvider';
import ErrorBoundary from '../../components/ErrorBoundary';

// Mock API responses
const mockContracts = [
  {
    id: 1,
    customer_name: 'John Doe',
    customer_phone: '+1234567890',
    status: 'active',
    frequency: 'monthly',
    total_visits: 12,
    completed_visits: 8,
    health_status: 'good'
  }
];

const mockVisits = [
  {
    id: 1,
    maintenance_contract_id: 1,
    scheduled_date: '2024-02-15',
    status: 'scheduled',
    customer_name: 'John Doe',
    customer_address: '123 Main St'
  }
];

// Mock fetch
global.fetch = vi.fn();

const createWrapper = (initialEntries = ['/']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TranslationProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </TranslationProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Maintenance Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockContracts, meta: { total: 1 } })
    });
  });

  describe('Contract Management Workflow', () => {
    it('should display contracts list and allow navigation', async () => {
      const Wrapper = createWrapper();
      
      render(<MaintenanceContracts />, { wrapper: Wrapper });

      // Wait for contracts to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check contract details are displayed
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('monthly')).toBeInTheDocument();
      expect(screen.getByText('8/12')).toBeInTheDocument(); // completed/total visits
    });

    it('should handle contract creation form validation', async () => {
      const Wrapper = createWrapper();
      
      render(<MaintenanceContractForm />, { wrapper: Wrapper });

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /create contract/i });
      fireEvent.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/customer is required/i)).toBeInTheDocument();
      });

      // Fill in required fields
      const customerSelect = screen.getByLabelText(/customer/i);
      fireEvent.change(customerSelect, { target: { value: '1' } });

      const frequencySelect = screen.getByLabelText(/frequency/i);
      fireEvent.change(frequencySelect, { target: { value: 'monthly' } });

      // Validation errors should disappear
      await waitFor(() => {
        expect(screen.queryByText(/customer is required/i)).not.toBeInTheDocument();
      });
    });

    it('should handle responsive layout changes', () => {
      const Wrapper = createWrapper();
      
      // Test desktop layout
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { rerender } = render(<MaintenanceContracts />, { wrapper: Wrapper });

      // Should show table layout on desktop
      expect(screen.getByRole('table')).toBeInTheDocument();

      // Test mobile layout
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });

      window.dispatchEvent(new Event('resize'));
      rerender(<MaintenanceContracts />);

      // Should show card layout on mobile
      expect(screen.getByTestId('mobile-card-layout')).toBeInTheDocument();
    });
  });

  describe('Technician Dashboard Workflow', () => {
    beforeEach(() => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockVisits })
      });
    });

    it('should display today\'s visits for technician', async () => {
      const Wrapper = createWrapper();
      
      render(<TechnicianDashboard />, { wrapper: Wrapper });

      // Wait for visits to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check visit details
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('scheduled')).toBeInTheDocument();
    });

    it('should handle visit status updates', async () => {
      const Wrapper = createWrapper();
      
      render(<TechnicianDashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Mock successful status update
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      // Click start visit button
      const startButton = screen.getByRole('button', { name: /start visit/i });
      fireEvent.click(startButton);

      // Should show confirmation
      await waitFor(() => {
        expect(screen.getByText(/visit started/i)).toBeInTheDocument();
      });
    });

    it('should handle offline functionality', async () => {
      const Wrapper = createWrapper();
      
      // Simulate offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      render(<TechnicianDashboard />, { wrapper: Wrapper });

      // Should show offline indicator
      expect(screen.getByText(/offline mode/i)).toBeInTheDocument();

      // Should still allow viewing cached data
      expect(screen.getByText(/cached visits/i)).toBeInTheDocument();
    });
  });

  describe('RTL/LTR Layout Testing', () => {
    it('should handle Arabic (RTL) layout correctly', () => {
      const Wrapper = createWrapper();
      
      // Set document direction to RTL
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';

      render(<MaintenanceContracts />, { wrapper: Wrapper });

      // Check RTL-specific styling is applied
      const container = screen.getByTestId('contracts-container');
      expect(container).toHaveClass('rtl');
      
      // Check text alignment
      expect(container).toHaveStyle('text-align: right');
    });

    it('should handle English (LTR) layout correctly', () => {
      const Wrapper = createWrapper();
      
      // Set document direction to LTR
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';

      render(<MaintenanceContracts />, { wrapper: Wrapper });

      // Check LTR-specific styling is applied
      const container = screen.getByTestId('contracts-container');
      expect(container).toHaveClass('ltr');
      
      // Check text alignment
      expect(container).toHaveStyle('text-align: left');
    });

    it('should maintain layout stability when switching languages', () => {
      const Wrapper = createWrapper();
      
      const { rerender } = render(<MaintenanceContracts />, { wrapper: Wrapper });

      // Start with English
      document.documentElement.lang = 'en';
      rerender(<MaintenanceContracts />);
      
      const initialLayout = screen.getByTestId('contracts-container').getBoundingClientRect();

      // Switch to Arabic
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
      rerender(<MaintenanceContracts />);
      
      const rtlLayout = screen.getByTestId('contracts-container').getBoundingClientRect();

      // Layout dimensions should remain stable
      expect(Math.abs(initialLayout.width - rtlLayout.width)).toBeLessThan(10);
      expect(Math.abs(initialLayout.height - rtlLayout.height)).toBeLessThan(10);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle API errors gracefully', async () => {
      const Wrapper = createWrapper();
      
      // Mock API error
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<MaintenanceContracts />, { wrapper: Wrapper });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to load contracts/i)).toBeInTheDocument();
      });

      // Should show retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should recover from errors with retry mechanism', async () => {
      const Wrapper = createWrapper();
      
      // First call fails
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      render(<MaintenanceContracts />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText(/failed to load contracts/i)).toBeInTheDocument();
      });

      // Mock successful retry
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockContracts, meta: { total: 1 } })
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Should show data after retry
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should handle component errors with error boundary', () => {
      const Wrapper = createWrapper();
      
      // Component that throws an error
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(<ErrorComponent />, { wrapper: Wrapper });

      // Should show error boundary fallback
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  describe('Performance Testing', () => {
    it('should render large lists efficiently', async () => {
      const Wrapper = createWrapper();
      
      // Mock large dataset
      const largeContractList = Array.from({ length: 100 }, (_, i) => ({
        ...mockContracts[0],
        id: i + 1,
        customer_name: `Customer ${i + 1}`
      }));

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: largeContractList, meta: { total: 100 } })
      });

      const startTime = performance.now();
      
      render(<MaintenanceContracts />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Customer 1')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (2 seconds)
      expect(renderTime).toBeLessThan(2000);
    });

    it('should handle rapid user interactions without lag', async () => {
      const Wrapper = createWrapper();
      
      render(<MaintenanceContractForm />, { wrapper: Wrapper });

      const customerSelect = screen.getByLabelText(/customer/i);
      
      // Simulate rapid typing
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        fireEvent.change(customerSelect, { target: { value: `test${i}` } });
      }
      
      const endTime = performance.now();
      const interactionTime = endTime - startTime;

      // Should handle interactions quickly (under 100ms)
      expect(interactionTime).toBeLessThan(100);
    });
  });
});