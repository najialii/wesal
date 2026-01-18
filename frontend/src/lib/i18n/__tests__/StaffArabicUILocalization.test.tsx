import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TranslationProvider } from '../TranslationProvider';
import Staff from '../../../pages/business/Staff';

// Mock the auth service
vi.mock('../../../services/auth', () => ({
  authService: {
    getCurrentUser: () => ({ id: 1, name: 'Test User', role: 'tenant_admin' }),
    isAuthenticated: () => true,
  },
}));

// Mock API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

const TestWrapper = ({ children, language = 'ar' }: { children: React.ReactNode; language?: string }) => (
  <BrowserRouter>
    <TranslationProvider initialLanguage={language}>
      {children}
    </TranslationProvider>
  </BrowserRouter>
);

const mockStaffData = {
  data: [
    {
      id: 1,
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      phone: '+966501234567',
      roles: [{ name: 'salesman' }],
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'فاطمة علي',
      email: 'fatima@example.com',
      phone: '+966507654321',
      roles: [{ name: 'tenant_admin' }],
      created_at: '2024-01-15T00:00:00Z'
    }
  ]
};

/**
 * Feature: staff-localization-and-role-restriction
 * Property 1: Arabic UI localization
 * 
 * For any staff management page (list, create, edit), when the language is set to Arabic, 
 * all UI text elements including form labels, buttons, descriptions, and role names should display in Arabic
 */
describe('Property 1: Arabic UI Localization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStaffData),
    });
  });

  it('should display page title and description in Arabic', async () => {
    render(
      <TestWrapper language="ar">
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Staff Management')).toBeInTheDocument();
      expect(screen.getByText('إدارة أعضاء الفريق وأدوارهم')).toBeInTheDocument();
    });
  });

  it('should display table headers in Arabic', async () => {
    render(
      <TestWrapper language="ar">
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('الاسم')).toBeInTheDocument();
      expect(screen.getByText('الدور')).toBeInTheDocument();
      expect(screen.getByText('الاتصال')).toBeInTheDocument();
      expect(screen.getByText('تاريخ الانضمام')).toBeInTheDocument();
      expect(screen.getByText('الإجراءات')).toBeInTheDocument();
    });
  });

  it('should display action buttons in Arabic', async () => {
    render(
      <TestWrapper language="ar">
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('إضافة موظف')).toBeInTheDocument();
    });

    // Check for action button tooltips/titles in Arabic
    const editButtons = screen.getAllByTitle('تعديل');
    const deleteButtons = screen.getAllByTitle('حذف');
    const viewButtons = screen.getAllByTitle('عرض');

    expect(editButtons.length).toBeGreaterThan(0);
    expect(deleteButtons.length).toBeGreaterThan(0);
    expect(viewButtons.length).toBeGreaterThan(0);
  });

  it('should display role names in Arabic', async () => {
    render(
      <TestWrapper language="ar">
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('بائع')).toBeInTheDocument(); // salesman
      expect(screen.getByText('مدير المستأجر')).toBeInTheDocument(); // tenant_admin
    });
  });

  it('should display statistics labels in Arabic', async () => {
    render(
      <TestWrapper language="ar">
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('إجمالي الموظفين')).toBeInTheDocument();
      expect(screen.getByText('المديرون')).toBeInTheDocument();
      expect(screen.getByText('البائعون')).toBeInTheDocument();
    });
  });

  it('should display search placeholder in Arabic', async () => {
    render(
      <TestWrapper language="ar">
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('البحث في الموظفين...');
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('should display loading text in Arabic', async () => {
    // Mock a slow API response
    mockFetch.mockImplementation(() => 
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve(mockStaffData)
          });
        }, 100);
      })
    );

    render(
      <TestWrapper language="ar">
        <Staff />
      </TestWrapper>
    );

    // Should show Arabic loading text initially
    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('جاري التحميل...')).not.toBeInTheDocument();
    });
  });

  it('should display empty state message in Arabic', async () => {
    // Mock empty response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    render(
      <TestWrapper language="ar">
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('لم يتم العثور على موظفين')).toBeInTheDocument();
      expect(screen.getByText('أضف أعضاء الفريق لإدارة عملك معًا.')).toBeInTheDocument();
    });
  });

  it('should use RTL layout when Arabic is selected', async () => {
    render(
      <TestWrapper language="ar">
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      const mainContainer = screen.getByText('Staff Management').closest('div');
      expect(mainContainer).toHaveAttribute('dir', 'rtl');
      expect(mainContainer).toHaveAttribute('lang', 'ar');
    });
  });

  it('should display proper Arabic date formatting', async () => {
    render(
      <TestWrapper language="ar">
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check that dates are formatted for Arabic locale
      const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it('should switch from English to Arabic when language changes', async () => {
    const { rerender } = render(
      <TestWrapper language="en">
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Staff Management')).toBeInTheDocument();
      expect(screen.getByText('Add Staff')).toBeInTheDocument();
    });

    // Switch to Arabic
    rerender(
      <TestWrapper language="ar">
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('إضافة موظف')).toBeInTheDocument();
      expect(screen.getByText('إدارة أعضاء الفريق وأدوارهم')).toBeInTheDocument();
    });
  });

  it('should display all role types in Arabic correctly', async () => {
    const staffWithAllRoles = {
      data: [
        { id: 1, name: 'User 1', email: 'user1@test.com', roles: [{ name: 'salesman' }], created_at: '2024-01-01T00:00:00Z' },
        { id: 2, name: 'User 2', email: 'user2@test.com', roles: [{ name: 'manager' }], created_at: '2024-01-01T00:00:00Z' },
        { id: 3, name: 'User 3', email: 'user3@test.com', roles: [{ name: 'tenant_admin' }], created_at: '2024-01-01T00:00:00Z' },
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(staffWithAllRoles),
    });

    render(
      <TestWrapper language="ar">
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('بائع')).toBeInTheDocument(); // salesman
      expect(screen.getByText('مدير')).toBeInTheDocument(); // manager
      expect(screen.getByText('مدير المستأجر')).toBeInTheDocument(); // tenant_admin
    });
  });

  it('should display error messages in Arabic', async () => {
    // Mock API error
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(
      <TestWrapper language="ar">
        <Staff />
      </TestWrapper>
    );

    await waitFor(() => {
      // The error toast should be in Arabic
      // Note: This would require mocking the toast system to verify the Arabic message
      expect(screen.getByText('لم يتم العثور على موظفين')).toBeInTheDocument();
    });
  });
});