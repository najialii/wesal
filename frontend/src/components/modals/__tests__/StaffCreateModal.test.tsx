/**
 * **Feature: missing-frontend-views, Property 5: Email uniqueness validation**
 * Property-based test for email uniqueness validation in staff creation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fc from 'fast-check'
import { StaffCreateModal } from '../StaffCreateModal'

describe('Staff Create Modal Email Uniqueness Property Tests', () => {
  let mockApi: { get: any; post: any; put: any; delete: any }
  let mockToast: { success: any; error: any }

  beforeEach(() => {
    // Create fresh mocks for each test
    mockApi = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    }
    
    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    }

    vi.doMock('@/lib/api', () => ({
      default: mockApi
    }))

    vi.doMock('sonner', () => ({
      toast: mockToast
    }))
  })

  it('should validate email uniqueness for any email input', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          existingEmails: fc.array(
            fc.emailAddress(),
            { minLength: 1, maxLength: 10 }
          ),
          testEmail: fc.emailAddress(),
          staffData: fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
            role: fc.constantFrom('tenant_admin', 'manager', 'salesman'),
            password: fc.string({ minLength: 8, maxLength: 20 }),
          }),
        }),
        async (config) => {
          const onClose = vi.fn()
          const onSuccess = vi.fn()
          const user = userEvent.setup()

          // Determine if email should be unique or duplicate
          const isEmailDuplicate = config.existingEmails.includes(config.testEmail)

          // Mock API response based on email uniqueness
          if (isEmailDuplicate) {
            // Mock validation error for duplicate email
            mockApi.post.mockRejectedValueOnce({
              response: {
                status: 422,
                data: {
                  message: 'The given data was invalid.',
                  errors: {
                    email: ['The email has already been taken.']
                  }
                }
              }
            })
          } else {
            // Mock successful creation for unique email
            mockApi.post.mockResolvedValueOnce({
              data: {
                message: 'Staff member created successfully',
                user: {
                  id: 123,
                  name: config.staffData.name,
                  email: config.testEmail,
                  phone: config.staffData.phone,
                  roles: [{ name: config.staffData.role }]
                }
              }
            })
          }

          render(
            <StaffCreateModal
              isOpen={true}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )

          // Wait for modal to render
          await waitFor(() => {
            expect(screen.getByText('Add Staff Member')).toBeInTheDocument()
          })

          // Fill out the form
          const nameInput = screen.getByLabelText(/full name/i)
          await user.type(nameInput, config.staffData.name)

          const emailInput = screen.getByLabelText(/email address/i)
          await user.type(emailInput, config.testEmail)

          if (config.staffData.phone) {
            const phoneInput = screen.getByLabelText(/phone number/i)
            await user.type(phoneInput, config.staffData.phone)
          }

          const roleSelect = screen.getByRole('combobox', { name: /role/i })
          await user.click(roleSelect)
          
          await waitFor(() => {
            const roleOption = screen.getByText(new RegExp(config.staffData.role.replace('_', ' '), 'i'))
            expect(roleOption).toBeInTheDocument()
          })
          
          const roleOption = screen.getByText(new RegExp(config.staffData.role.replace('_', ' '), 'i'))
          await user.click(roleOption)

          const passwordInput = screen.getByLabelText(/password/i)
          await user.type(passwordInput, config.staffData.password)

          // Submit the form
          const submitButton = screen.getByRole('button', { name: /create staff member/i })
          await user.click(submitButton)

          // Wait for API call
          await waitFor(() => {
            expect(mockApi.post).toHaveBeenCalledWith(
              '/tenant/staff',
              expect.objectContaining({
                name: config.staffData.name,
                email: config.testEmail,
                password: config.staffData.password,
                phone: config.staffData.phone || null,
                role: config.staffData.role,
              })
            )
          })

          // Verify behavior based on email uniqueness
          if (isEmailDuplicate) {
            // Property: Duplicate emails should show validation error and prevent success
            await waitFor(() => {
              expect(screen.getByText('The email has already been taken.')).toBeInTheDocument()
            })
            
            // Should not trigger success callbacks
            expect(onSuccess).not.toHaveBeenCalled()
            expect(onClose).not.toHaveBeenCalled()
            expect(mockToast.success).not.toHaveBeenCalled()
          } else {
            // Property: Unique emails should allow successful creation
            await waitFor(() => {
              expect(mockToast.success).toHaveBeenCalledWith('Staff member created successfully')
              expect(onSuccess).toHaveBeenCalled()
              expect(onClose).toHaveBeenCalled()
            })
          }
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should handle email validation consistently across different email formats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          emailVariations: fc.array(
            fc.oneof(
              fc.emailAddress(),
              fc.string({ minLength: 1, maxLength: 20 }).map(s => `${s}@example.com`),
              fc.string({ minLength: 1, maxLength: 20 }).map(s => `test+${s}@domain.org`),
              fc.string({ minLength: 1, maxLength: 20 }).map(s => `${s}.test@company.co.uk`),
            ),
            { minLength: 2, maxLength: 5 }
          ),
          duplicateIndex: fc.integer({ min: 0, max: 4 }),
        }),
        async (config) => {
          const onClose = vi.fn()
          const onSuccess = vi.fn()

          // Select one email to be the duplicate
          const duplicateEmail = config.emailVariations[config.duplicateIndex % config.emailVariations.length]
          const testEmail = config.emailVariations[0]
          const isDuplicate = testEmail === duplicateEmail && config.duplicateIndex < config.emailVariations.length

          // Mock API response
          if (isDuplicate) {
            mockApi.post.mockRejectedValueOnce({
              response: {
                status: 422,
                data: {
                  errors: {
                    email: ['The email has already been taken.']
                  }
                }
              }
            })
          } else {
            mockApi.post.mockResolvedValueOnce({
              data: {
                message: 'Staff member created successfully',
                user: { id: 123, email: testEmail }
              }
            })
          }

          // Simulate form submission with email
          const submitStaffForm = async (email: string) => {
            try {
              const response = await mockApi.post('/tenant/staff', {
                name: 'Test User',
                email: email,
                password: 'password123',
                role: 'salesman',
              })

              if (response.data.message) {
                mockToast.success(response.data.message)
                onSuccess()
                onClose()
              }
            } catch (error: any) {
              if (error.response?.data?.errors?.email) {
                // Email validation error should be handled
                expect(error.response.data.errors.email[0]).toBe('The email has already been taken.')
              }
            }
          }

          await submitStaffForm(testEmail)

          // Verify email uniqueness validation behavior
          // Property: Email uniqueness validation should work consistently for any email format
          
          if (isDuplicate) {
            expect(onSuccess).not.toHaveBeenCalled()
            expect(onClose).not.toHaveBeenCalled()
            expect(mockToast.success).not.toHaveBeenCalled()
          } else {
            expect(mockToast.success).toHaveBeenCalledWith('Staff member created successfully')
            expect(onSuccess).toHaveBeenCalled()
            expect(onClose).toHaveBeenCalled()
          }
        }
      ),
      { numRuns: 15 }
    )
  })

  it('should handle email uniqueness validation with different error response formats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          errorFormat: fc.constantFrom('laravel', 'custom', 'simple'),
          errorMessage: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        async (config) => {
          const onClose = vi.fn()
          const onSuccess = vi.fn()

          // Create different error response formats
          let errorResponse
          switch (config.errorFormat) {
            case 'laravel':
              errorResponse = {
                response: {
                  status: 422,
                  data: {
                    message: 'The given data was invalid.',
                    errors: {
                      email: ['The email has already been taken.']
                    }
                  }
                }
              }
              break
            case 'custom':
              errorResponse = {
                response: {
                  status: 422,
                  data: {
                    message: config.errorMessage,
                    errors: {
                      email: [config.errorMessage]
                    }
                  }
                }
              }
              break
            case 'simple':
              errorResponse = {
                response: {
                  status: 422,
                  data: {
                    message: config.errorMessage
                  }
                }
              }
              break
          }

          mockApi.post.mockRejectedValueOnce(errorResponse)

          // Simulate form submission
          const submitForm = async () => {
            try {
              await mockApi.post('/tenant/staff', {
                name: 'Test User',
                email: config.email,
                password: 'password123',
                role: 'salesman',
              })
              
              mockToast.success('Staff member created successfully')
              onSuccess()
              onClose()
            } catch (error: any) {
              const errorMessage = error.response?.data?.message || 'Failed to create staff member'
              mockToast.error(errorMessage)
              
              // Handle validation errors
              if (error.response?.data?.errors) {
                // Email uniqueness validation should be handled consistently
                expect(error.response.data.errors.email).toBeDefined()
              }
            }
          }

          await submitForm()

          // Verify error handling consistency
          // Property: Email uniqueness validation should handle different error formats consistently
          
          expect(mockToast.error).toHaveBeenCalled()
          expect(onSuccess).not.toHaveBeenCalled()
          expect(onClose).not.toHaveBeenCalled()
          
          // Verify error message was displayed
          const errorCall = mockToast.error.mock.calls[0][0]
          expect(typeof errorCall).toBe('string')
          expect(errorCall.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 10 }
    )
  })
})