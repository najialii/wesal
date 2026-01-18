import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { fc } from 'fast-check'
import { TenantCreateModal } from '../TenantCreateModal'
import api from '@/lib/api'

// Mock the API
vi.mock('@/lib/api')
const mockApi = vi.mocked(api)

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

/**
 * **Feature: missing-frontend-views, Property 6: Admin view completeness**
 * **Validates: Requirements 4.2, 4.3**
 * 
 * For any admin view (tenant creation, plan management), all required information
 * should be displayed and accessible to the user. The view should provide complete
 * information needed for administrative decisions.
 */
describe('Admin View Completeness Property Tests', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderTenantCreateModal = () => {
    return render(
      <TenantCreateModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
  }

  it('should display all required tenant creation fields and information', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 100 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            price: fc.float({ min: 0, max: 1000 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (plans) => {
          // Mock API to return plans
          mockApi.get.mockResolvedValueOnce({
            data: { data: plans }
          })

          renderTenantCreateModal()

          // Wait for plans to load
          await waitFor(() => {
            expect(mockApi.get).toHaveBeenCalledWith('/admin/plans')
          })

          // Verify all required sections are present
          expect(screen.getByText('Tenant Information')).toBeInTheDocument()
          expect(screen.getByText('Admin Account')).toBeInTheDocument()
          expect(screen.getByText('Subscription Plan')).toBeInTheDocument()

          // Verify all required form fields are present
          expect(screen.getByLabelText(/tenant name/i)).toBeInTheDocument()
          expect(screen.getByLabelText(/domain/i)).toBeInTheDocument()
          expect(screen.getByLabelText(/admin name/i)).toBeInTheDocument()
          expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument()
          expect(screen.getByLabelText(/plan/i)).toBeInTheDocument()

          // Verify descriptive text is present
          expect(screen.getByText(/the name of the business or organization/i)).toBeInTheDocument()
          expect(screen.getByText(/subdomain for tenant access/i)).toBeInTheDocument()
          expect(screen.getByText(/name of the tenant administrator/i)).toBeInTheDocument()
          expect(screen.getByText(/email address for the tenant administrator/i)).toBeInTheDocument()
          expect(screen.getByText(/choose the subscription plan/i)).toBeInTheDocument()

          // Verify setup information is displayed
          expect(screen.getByText('Tenant Setup')).toBeInTheDocument()
          expect(screen.getByText(/isolated database and data/i)).toBeInTheDocument()
          expect(screen.getByText(/admin account with full permissions/i)).toBeInTheDocument()
          expect(screen.getByText(/active subscription based on selected plan/i)).toBeInTheDocument()
          expect(screen.getByText(/access via the specified subdomain/i)).toBeInTheDocument()

          // Verify domain preview is shown
          expect(screen.getByText(/full url will be/i)).toBeInTheDocument()
          expect(screen.getByText(/yourdomain\.com/)).toBeInTheDocument()
        }
      ),
      { numRuns: 5 }
    )
  })

  it('should provide complete plan information for admin decision making', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 100 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            price: fc.float({ min: 0, max: 1000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (plans) => {
          // Mock API to return plans
          mockApi.get.mockResolvedValueOnce({
            data: { data: plans }
          })

          renderTenantCreateModal()

          // Wait for plans to load
          await waitFor(() => {
            expect(mockApi.get).toHaveBeenCalledWith('/admin/plans')
          })

          // Open the plan selector
          const planSelect = screen.getByLabelText(/plan/i)
          fireEvent.click(planSelect)

          // Verify all plans are displayed with complete information
          plans.forEach(plan => {
            const planOption = screen.getByText(new RegExp(`${plan.name}.*${plan.price}/month`, 'i'))
            expect(planOption).toBeInTheDocument()
          })
        }
      ),
      { numRuns: 5 }
    )
  })

  it('should maintain admin view completeness across different interaction states', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          plans: fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              price: fc.float({ min: 0, max: 1000 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          tenantData: fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            domain: fc.string({ minLength: 1, maxLength: 20 }).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '')),
            admin_name: fc.string({ minLength: 1, maxLength: 50 }),
            admin_email: fc.emailAddress(),
          })
        }),
        async ({ plans, tenantData }) => {
          // Mock API to return plans
          mockApi.get.mockResolvedValueOnce({
            data: { data: plans }
          })

          renderTenantCreateModal()

          // Wait for plans to load
          await waitFor(() => {
            expect(mockApi.get).toHaveBeenCalledWith('/admin/plans')
          })

          // Fill out form fields
          fireEvent.change(screen.getByLabelText(/tenant name/i), { target: { value: tenantData.name } })
          fireEvent.change(screen.getByLabelText(/domain/i), { target: { value: tenantData.domain } })
          fireEvent.change(screen.getByLabelText(/admin name/i), { target: { value: tenantData.admin_name } })
          fireEvent.change(screen.getByLabelText(/admin email/i), { target: { value: tenantData.admin_email } })

          // Verify domain preview updates dynamically
          const domainPreview = screen.getByText(new RegExp(`${tenantData.domain}\\.yourdomain\\.com`))
          expect(domainPreview).toBeInTheDocument()

          // Verify all informational content remains visible during interaction
          expect(screen.getByText('Tenant Setup')).toBeInTheDocument()
          expect(screen.getByText(/isolated database and data/i)).toBeInTheDocument()
          expect(screen.getByText(/admin account with full permissions/i)).toBeInTheDocument()

          // Verify form validation feedback is complete
          const submitButton = screen.getByRole('button', { name: /create tenant/i })
          expect(submitButton).toBeInTheDocument()
          
          // Button should be disabled if form is incomplete (no plan selected)
          expect(submitButton).toBeDisabled()
        }
      ),
      { numRuns: 5 }
    )
  })
})