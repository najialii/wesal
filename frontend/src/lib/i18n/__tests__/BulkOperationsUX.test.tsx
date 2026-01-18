import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { TranslationProvider } from '../TranslationProvider';
import Tenants from '../../../pages/admin/Tenants';

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

describe('Property 22: Bulk Operations User Experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [
          { id: 1, name: 'Tenant 1', email: 'tenant1@example.com', status: 'active' },
          { id: 2, name: 'Tenant 2', email: 'tenant2@example.com', status: 'active' },
          { id: 3, name: 'Tenant 3', email: 'tenant3@example.com', status: 'inactive' },
        ],
        meta: { total: 3, per_page: 10, current_page: 1 }
      }),
    });
  });

  it('should provide clear selection feedback for bulk operations', async () => {
    render(
      <TestWrapper>
        <Tenants />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Tenant 1')).toBeInTheDocument();
    });

    // Property: Bulk selection should provide clear visual feedback
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    const individualCheckboxes = screen.getAllByRole('checkbox').filter(cb => cb !== selectAllCheckbox);

    // Test select all functionality
    await userEvent.click(selectAllCheckbox);
    
    // All individual checkboxes should be checked
    individualCheckboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });

    // Should show selection count
    expect(screen.getByText(/3 selected/i)).toBeInTheDocument();

    // Should show bulk action buttons
    expect(screen.getByRole('button', { name: /bulk actions/i })).toBeInTheDocument();
  });

  it('should show confirmation dialogs for destructive bulk operations', async () => {
    render(
      <TestWrapper>
        <Tenants />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Tenant 1')).toBeInTheDocument();
    });

    // Select multiple items
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    await userEvent.click(selectAllCheckbox);

    // Open bulk actions menu
    const bulkActionsButton = screen.getByRole('button', { name: /bulk actions/i });
    await userEvent.click(bulkActionsButton);

    // Click delete action
    const deleteAction = screen.getByRole('menuitem', { name: /delete/i });
    await userEvent.click(deleteAction);

    // Property: Should show confirmation dialog for destructive operations
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      expect(screen.getByText(/3 tenants/i)).toBeInTheDocument();
    });

    // Should have cancel and confirm buttons
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should provide progress feedback during bulk operations', async () => {
    // Mock a slow API response
    mockFetch.mockImplementation((url) => {
      if (url.includes('/bulk-delete')) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ success: true, deleted: 3 })
            });
          }, 1000);
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 1, name: 'Tenant 1', email: 'tenant1@example.com', status: 'active' },
            { id: 2, name: 'Tenant 2', email: 'tenant2@example.com', status: 'active' },
            { id: 3, name: 'Tenant 3', email: 'tenant3@example.com', status: 'inactive' },
          ],
          meta: { total: 3, per_page: 10, current_page: 1 }
        }),
      });
    });

    render(
      <TestWrapper>
        <Tenants />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Tenant 1')).toBeInTheDocument();
    });

    // Select items and perform bulk delete
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    await userEvent.click(selectAllCheckbox);

    const bulkActionsButton = screen.getByRole('button', { name: /bulk actions/i });
    await userEvent.click(bulkActionsButton);

    const deleteAction = screen.getByRole('menuitem', { name: /delete/i });
    await userEvent.click(deleteAction);

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(confirmButton);

    // Property: Should show progress indicator during operation
    await waitFor(() => {
      expect(screen.getByText(/deleting/i)).toBeInTheDocument();
    });

    // Should show progress bar or spinner
    expect(screen.getByRole('progressbar') || screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should provide success feedback after bulk operations', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/bulk-delete')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, deleted: 2 })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 3, name: 'Tenant 3', email: 'tenant3@example.com', status: 'inactive' },
          ],
          meta: { total: 1, per_page: 10, current_page: 1 }
        }),
      });
    });

    render(
      <TestWrapper>
        <Tenants />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Tenant 1')).toBeInTheDocument();
    });

    // Select first two items
    const checkboxes = screen.getAllByRole('checkbox').filter(cb => 
      !cb.getAttribute('aria-label')?.includes('select all')
    );
    
    await userEvent.click(checkboxes[0]);
    await userEvent.click(checkboxes[1]);

    // Perform bulk delete
    const bulkActionsButton = screen.getByRole('button', { name: /bulk actions/i });
    await userEvent.click(bulkActionsButton);

    const deleteAction = screen.getByRole('menuitem', { name: /delete/i });
    await userEvent.click(deleteAction);

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(confirmButton);

    // Property: Should show success message with operation details
    await waitFor(() => {
      expect(screen.getByText(/successfully deleted 2 tenants/i)).toBeInTheDocument();
    });

    // Should clear selection after successful operation
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    expect(selectAllCheckbox).not.toBeChecked();
  });

  it('should handle partial failures in bulk operations gracefully', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/bulk-delete')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: false, 
            deleted: 1, 
            failed: 1,
            errors: ['Tenant 2 has active subscriptions and cannot be deleted']
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 1, name: 'Tenant 1', email: 'tenant1@example.com', status: 'active' },
            { id: 2, name: 'Tenant 2', email: 'tenant2@example.com', status: 'active' },
          ],
          meta: { total: 2, per_page: 10, current_page: 1 }
        }),
      });
    });

    render(
      <TestWrapper>
        <Tenants />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Tenant 1')).toBeInTheDocument();
    });

    // Select items and perform bulk delete
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    await userEvent.click(selectAllCheckbox);

    const bulkActionsButton = screen.getByRole('button', { name: /bulk actions/i });
    await userEvent.click(bulkActionsButton);

    const deleteAction = screen.getByRole('menuitem', { name: /delete/i });
    await userEvent.click(deleteAction);

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(confirmButton);

    // Property: Should show detailed feedback for partial failures
    await waitFor(() => {
      expect(screen.getByText(/1 tenant deleted, 1 failed/i)).toBeInTheDocument();
      expect(screen.getByText(/tenant 2 has active subscriptions/i)).toBeInTheDocument();
    });
  });

  it('should allow cancellation of bulk operations', async () => {
    render(
      <TestWrapper>
        <Tenants />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Tenant 1')).toBeInTheDocument();
    });

    // Select items
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    await userEvent.click(selectAllCheckbox);

    // Open bulk actions and start delete
    const bulkActionsButton = screen.getByRole('button', { name: /bulk actions/i });
    await userEvent.click(bulkActionsButton);

    const deleteAction = screen.getByRole('menuitem', { name: /delete/i });
    await userEvent.click(deleteAction);

    // Property: Should allow cancellation at confirmation stage
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    // Dialog should close and selection should remain
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Selection should still be active
    expect(selectAllCheckbox).toBeChecked();
    expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
  });
});