/**
 * **Feature: missing-frontend-views, Property 2: Form validation and error preservation**
 * Property-based test for form validation and error preservation across all forms
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fc } from 'fast-check'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form } from '../form'
import { TextField, NumberField, SelectField } from '../form-fields'
import { FormModal } from '../form-modal'

// Test schemas for different validation scenarios
const strictSchema = z.object({
  requiredText: z.string().min(1, 'This field is required'),
  requiredEmail: z.string().email('Please enter a valid email'),
  requiredNumber: z.number().min(1, 'Must be at least 1'),
  optionalText: z.string().optional(),
})

const complexSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(18, 'Must be 18 or older').max(120, 'Invalid age'),
  category: z.string().min(1, 'Please select a category'),
  phone: z.string().regex(/^\d{10,15}$/, 'Invalid phone number').optional(),
})

type StrictFormData = z.infer<typeof strictSchema>
type ComplexFormData = z.infer<typeof complexSchema>

function TestValidationForm({ 
  onSubmit, 
  schema, 
  initialData = {},
  showApiErrors = false,
  apiErrors = {}
}: { 
  onSubmit: (data: any) => void
  schema: z.ZodSchema
  initialData?: any
  showApiErrors?: boolean
  apiErrors?: Record<string, string>
}) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  })

  // Simulate API errors
  React.useEffect(() => {
    if (showApiErrors) {
      Object.entries(apiErrors).forEach(([field, message]) => {
        form.setError(field as any, { message })
      })
    }
  }, [showApiErrors, apiErrors, form])

  const isStrictSchema = schema === strictSchema

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isStrictSchema ? (
          <>
            <TextField
              form={form}
              name="requiredText"
              label="Required Text"
              required
              placeholder="Enter text"
            />
            <TextField
              form={form}
              name="requiredEmail"
              label="Required Email"
              type="email"
              required
              placeholder="Enter email"
            />
            <NumberField
              form={form}
              name="requiredNumber"
              label="Required Number"
              required
              min={1}
            />
            <TextField
              form={form}
              name="optionalText"
              label="Optional Text"
              placeholder="Optional field"
            />
          </>
        ) : (
          <>
            <TextField
              form={form}
              name="name"
              label="Name"
              required
              placeholder="Enter name"
            />
            <TextField
              form={form}
              name="email"
              label="Email"
              type="email"
              required
              placeholder="Enter email"
            />
            <NumberField
              form={form}
              name="age"
              label="Age"
              required
              min={18}
              max={120}
            />
            <SelectField
              form={form}
              name="category"
              label="Category"
              required
              placeholder="Select category"
              options={[
                { value: 'cat1', label: 'Category 1' },
                { value: 'cat2', label: 'Category 2' },
                { value: 'cat3', label: 'Category 3' },
              ]}
            />
            <TextField
              form={form}
              name="phone"
              label="Phone"
              type="tel"
              placeholder="Optional phone"
            />
          </>
        )}
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </form>
    </Form>
  )
}

describe('Form Validation and Error Preservation Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should preserve valid field values when validation fails on other fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          validText: fc.string({ minLength: 1, maxLength: 50 }),
          validEmail: fc.emailAddress(),
          invalidNumber: fc.integer({ max: 0 }), // Invalid: must be >= 1
          validOptional: fc.option(fc.string({ maxLength: 100 })),
          submitAttempts: fc.integer({ min: 1, max: 3 }),
        }),
        async (config) => {
          const onSubmit = vi.fn()
          const user = userEvent.setup()

          render(
            <TestValidationForm 
              onSubmit={onSubmit}
              schema={strictSchema}
              initialData={{
                requiredText: config.validText,
                requiredEmail: config.validEmail,
                requiredNumber: config.invalidNumber,
                optionalText: config.validOptional || '',
              }}
            />
          )

          // Attempt to submit multiple times
          for (let i = 0; i < config.submitAttempts; i++) {
            const submitButton = screen.getByTestId('submit-button')
            await user.click(submitButton)

            // Wait for validation
            await waitFor(() => {
              expect(screen.getByText('Must be at least 1')).toBeInTheDocument()
            })

            // Valid fields should preserve their values
            expect(screen.getByDisplayValue(config.validText)).toBeInTheDocument()
            expect(screen.getByDisplayValue(config.validEmail)).toBeInTheDocument()
            
            if (config.validOptional) {
              expect(screen.getByDisplayValue(config.validOptional)).toBeInTheDocument()
            }

            // Invalid field should show error but preserve value
            expect(screen.getByDisplayValue(config.invalidNumber.toString())).toBeInTheDocument()
            expect(screen.getByText('Must be at least 1')).toBeInTheDocument()

            // Form should not submit
            expect(onSubmit).not.toHaveBeenCalled()
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle complex validation scenarios while preserving partial valid data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          validName: fc.string({ minLength: 2, maxLength: 50 }),
          invalidEmail: fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@')),
          validAge: fc.integer({ min: 18, max: 120 }),
          invalidPhone: fc.option(fc.string({ minLength: 1, maxLength: 5 })), // Too short
          category: fc.constantFrom('cat1', 'cat2', 'cat3'),
        }),
        async (config) => {
          const onSubmit = vi.fn()
          const user = userEvent.setup()

          render(
            <TestValidationForm 
              onSubmit={onSubmit}
              schema={complexSchema}
              initialData={{
                name: config.validName,
                email: config.invalidEmail,
                age: config.validAge,
                category: config.category,
                phone: config.invalidPhone || '',
              }}
            />
          )

          const submitButton = screen.getByTestId('submit-button')
          await user.click(submitButton)

          // Wait for validation errors
          await waitFor(() => {
            expect(screen.getByText('Invalid email format')).toBeInTheDocument()
          })

          // Valid fields should preserve their values
          expect(screen.getByDisplayValue(config.validName)).toBeInTheDocument()
          expect(screen.getByDisplayValue(config.validAge.toString())).toBeInTheDocument()

          // Invalid email should show error but preserve value
          expect(screen.getByDisplayValue(config.invalidEmail)).toBeInTheDocument()
          expect(screen.getByText('Invalid email format')).toBeInTheDocument()

          // Invalid phone should show error if provided
          if (config.invalidPhone) {
            expect(screen.getByDisplayValue(config.invalidPhone)).toBeInTheDocument()
            expect(screen.getByText('Invalid phone number')).toBeInTheDocument()
          }

          // Category should maintain selection
          const categorySelect = screen.getByRole('combobox', { name: /category/i })
          expect(categorySelect).toHaveAttribute('data-value', config.category)

          expect(onSubmit).not.toHaveBeenCalled()
        }
      ),
      { numRuns: 40 }
    )
  })

  it('should preserve form state when API errors occur', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          formData: fc.record({
            requiredText: fc.string({ minLength: 1, maxLength: 30 }),
            requiredEmail: fc.emailAddress(),
            requiredNumber: fc.integer({ min: 1, max: 100 }),
            optionalText: fc.option(fc.string({ maxLength: 50 })),
          }),
          apiErrors: fc.record({
            requiredText: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            requiredEmail: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          }),
        }),
        async (config) => {
          const onSubmit = vi.fn()

          const { rerender } = render(
            <TestValidationForm 
              onSubmit={onSubmit}
              schema={strictSchema}
              initialData={config.formData}
            />
          )

          // Verify initial values are set
          expect(screen.getByDisplayValue(config.formData.requiredText)).toBeInTheDocument()
          expect(screen.getByDisplayValue(config.formData.requiredEmail)).toBeInTheDocument()
          expect(screen.getByDisplayValue(config.formData.requiredNumber.toString())).toBeInTheDocument()

          // Simulate API errors
          const apiErrorsToShow = Object.fromEntries(
            Object.entries(config.apiErrors).filter(([_, value]) => value)
          )

          if (Object.keys(apiErrorsToShow).length > 0) {
            rerender(
              <TestValidationForm 
                onSubmit={onSubmit}
                schema={strictSchema}
                initialData={config.formData}
                showApiErrors={true}
                apiErrors={apiErrorsToShow}
              />
            )

            // Wait for API errors to appear
            await waitFor(() => {
              const errorMessages = Object.values(apiErrorsToShow)
              if (errorMessages.length > 0) {
                expect(screen.getByText(errorMessages[0] as string)).toBeInTheDocument()
              }
            })

            // Form values should still be preserved
            expect(screen.getByDisplayValue(config.formData.requiredText)).toBeInTheDocument()
            expect(screen.getByDisplayValue(config.formData.requiredEmail)).toBeInTheDocument()
            expect(screen.getByDisplayValue(config.formData.requiredNumber.toString())).toBeInTheDocument()

            if (config.formData.optionalText) {
              expect(screen.getByDisplayValue(config.formData.optionalText)).toBeInTheDocument()
            }
          }
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should maintain form state consistency in modal forms', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 30 }),
          formData: fc.record({
            requiredText: fc.string({ minLength: 1, maxLength: 20 }),
            requiredEmail: fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@')), // Invalid
            requiredNumber: fc.integer({ min: 1, max: 50 }),
          }),
          modalToggleCount: fc.integer({ min: 1, max: 3 }),
        }),
        async (config) => {
          const onClose = vi.fn()
          const onSubmit = vi.fn()
          const user = userEvent.setup()

          let isOpen = true

          const { rerender } = render(
            <FormModal
              isOpen={isOpen}
              onClose={onClose}
              title={config.title}
              onSubmit={onSubmit}
            >
              <TestValidationForm 
                onSubmit={onSubmit}
                schema={strictSchema}
                initialData={config.formData}
              />
            </FormModal>
          )

          // Try to submit to trigger validation
          const submitButton = screen.getByText('Save')
          await user.click(submitButton)

          // Wait for validation error
          await waitFor(() => {
            expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
          })

          // Values should be preserved even with validation errors
          expect(screen.getByDisplayValue(config.formData.requiredText)).toBeInTheDocument()
          expect(screen.getByDisplayValue(config.formData.requiredEmail)).toBeInTheDocument()
          expect(screen.getByDisplayValue(config.formData.requiredNumber.toString())).toBeInTheDocument()

          // Toggle modal multiple times
          for (let i = 0; i < config.modalToggleCount; i++) {
            isOpen = false
            rerender(
              <FormModal
                isOpen={isOpen}
                onClose={onClose}
                title={config.title}
                onSubmit={onSubmit}
              >
                <TestValidationForm 
                  onSubmit={onSubmit}
                  schema={strictSchema}
                  initialData={config.formData}
                />
              </FormModal>
            )

            isOpen = true
            rerender(
              <FormModal
                isOpen={isOpen}
                onClose={onClose}
                title={config.title}
                onSubmit={onSubmit}
              >
                <TestValidationForm 
                  onSubmit={onSubmit}
                  schema={strictSchema}
                  initialData={config.formData}
                />
              </FormModal>
            )

            // Form should maintain its initial values after reopening
            await waitFor(() => {
              expect(screen.getByDisplayValue(config.formData.requiredText)).toBeInTheDocument()
            })
            
            expect(screen.getByDisplayValue(config.formData.requiredEmail)).toBeInTheDocument()
            expect(screen.getByDisplayValue(config.formData.requiredNumber.toString())).toBeInTheDocument()
          }
        }
      ),
      { numRuns: 25 }
    )
  })
})