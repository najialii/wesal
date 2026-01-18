import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { fc } from 'fast-check'
import { StaffCreateModal } from '../StaffCreateModal'
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
 * **Feature: missing-frontend-views, Property 5: Email uniqueness validation**
 * **Validates: Requirements 3.2**
 * 
 * For any email address that already exists in the system, attempting to create
 * a staff member with that email should result in a validation error being displayed
 * and the form submission should be prevented.
 */
describe('Email Uniqueness Validation Property Tests', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderStaffCreateModal = () => {
    return render(
      <StaffCreateModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )
  }

  it('should prevent staff creation when email already exists in system', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.emailAddress(),
          role: fc.constantFrom('tenant_admin', 'manager', 'salesman'),
        }),
        async (staffData) => {
          // Setup: Mock API to return email already exists error
          mockApi.post.mockRejectedValueOnce({
            response: {
              status: 422,
              data: {
                message: 'The email has already been taken.',
                errors: {
                  email: ['The email has already been taken.']
                }
              }
            }
          })

          renderStaffCreateModal()

          // Fill out the form with the generated data
          const nameInput = screen.getByLabelText(/name/i)
          const emailInput = screen.getByLabelText(/email/i)
          const roleSelect = screen.getByLabelText(/role/i)

          fireEvent.change(nameInput, { target: { value: staffData.name } })
          fireEvent.change(emailInput, { target: { value: staffData.email } })
          fireEvent.change(roleSelect, { target: { value: staffData.role } })

          // Submit the form
          const submitButton = screen.getByRole('button', { name: /create staff member/i })
          fireEvent.click(submitButton)

          // Wait for the API call and error handling
          await waitFor(() => {
            expect(mockApi.post).toHaveBeenCalledWith('/tenant/staff', expect.objectContaining({
              name: staffData.name,
              email: staffData.email,
              role: staffData.role,
            }))
          })

          // Verify that the email error is displayed
          await waitFor(() => {
            const emailError = screen.getByText(/email has already been taken/i)
            expect(emailError).toBeInTheDocument()
          })

          // Verify that the modal is still open (form submission was prevented)
          expect(mockOnSuccess).not.toHaveBeenCalled()
          expect(mockOnClose).not.toHaveBeenCalled()

          // Verify that the form still contains the user's input
          expect(nameInput).toHaveValue(staffData.name)
          expect(emailInput).toHaveValue(staffData.email)
          expect(roleSelect).toHaveValue(staffData.role)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should allow staff creation when email is unique', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.emailAddress(),
          role: fc.constantFrom('tenant_admin', 'manager', 'salesman'),
        }),
        async (staffData) => {
          // Setup: Mock API to return success for unique email
          mockApi.post.mockResolvedValueOnce({
            data: {
              data: {
                id: 1,
                name: staffData.name,
                email: staffData.email,
                role: staffData.role,
              }
            }
          })

          renderStaffCreateModal()

          // Fill out the form with the generated data
          const nameInput = screen.getByLabelText(/name/i)
          const emailInput = screen.getByLabelText(/email/i)
          const roleSelect = screen.getByLabelText(/role/i)

          fireEvent.change(nameInput, { target: { value: staffData.name } })
          fireEvent.change(emailInput, { target: { value: staffData.email } })
          fireEvent.change(roleSelect, { target: { value: staffData.role } })

          // Submit the form
          const submitButton = screen.getByRole('button', { name: /create staff member/i })
          fireEvent.click(submitButton)

          // Wait for successful submission
          await waitFor(() => {
            expect(mockApi.post).toHaveBeenCalledWith('/tenant/staff', expect.objectContaining({
              name: staffData.name,
              email: staffData.email,
              role: staffData.role,
            }))
          })

          // Verify that success callback was called (modal closes and list refreshes)
          await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled()
          })

          // Verify no email validation errors are shown
          expect(screen.queryByText(/email has already been taken/i)).not.toBeInTheDocument()
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should handle email validation consistently across multiple submission attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
            role: fc.constantFrom('tenant_admin', 'manager', 'salesman'),
            shouldFail: fc.boolean(),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (staffDataArray) => {
          for (const staffData of staffDataArray) {
            vi.clearAllMocks()

            if (staffData.shouldFail) {
              // Mock email already exists error
              mockApi.post.mockRejectedValueOnce({
                response: {
                  status: 422,
                  data: {
                    message: 'The email has already been taken.',
                    errors: {
                      email: ['The email has already been taken.']
                    }
                  }
                }
              })
            } else {
              // Mock successful creation
              mockApi.post.mockResolvedValueOnce({
                data: {
                  data: {
                    id: Math.floor(Math.random() * 1000),
                    name: staffData.name,
                    email: staffData.email,
                    role: staffData.role,
                  }
                }
              })
            }

            renderStaffCreateModal()

            // Fill out and submit form
            const nameInput = screen.getByLabelText(/name/i)
            const emailInput = screen.getByLabelText(/email/i)
            const roleSelect = screen.getByLabelText(/role/i)

            fireEvent.change(nameInput, { target: { value: staffData.name } })
            fireEvent.change(emailInput, { target: { value: staffData.email } })
            fireEvent.change(roleSelect, { target: { value: staffData.role } })

            const submitButton = screen.getByRole('button', { name: /create staff member/i })
            fireEvent.click(submitButton)

            await waitFor(() => {
              expect(mockApi.post).toHaveBeenCalled()
            })

            if (staffData.shouldFail) {
              // Should show error and keep form open
              await waitFor(() => {
                expect(screen.getByText(/email has already been taken/i)).toBeInTheDocument()
              })
              expect(mockOnSuccess).not.toHaveBeenCalled()
            } else {
              // Should succeed and close form
              await waitFor(() => {
                expect(mockOnSuccess).toHaveBeenCalled()
              })
              expect(screen.queryByText(/email has already been taken/i)).not.toBeInTheDocument()
            }
          }
        }
      ),
      { numRuns: 5 }
    )
  })
})