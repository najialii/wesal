/**
 * **Feature: missing-frontend-views, Property 9: Form consistency**
 * Property-based test for form consistency across the application
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fc } from 'fast-check'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form } from '../form'
import { TextField, NumberField, SelectField, CheckboxField } from '../form-fields'
import { FormModal } from '../form-modal'

// Test form schema
const testSchema = z.object({
  textField: z.string().min(1, 'Text field is required'),
  numberField: z.number().min(0, 'Number must be positive'),
  selectField: z.string().min(1, 'Please select an option'),
  checkboxField: z.boolean(),
})

type TestFormData = z.infer<typeof testSchema>

function TestForm({ 
  onSubmit, 
  loading = false,
  initialData = {} 
}: { 
  onSubmit: (data: TestFormData) => void
  loading?: boolean
  initialData?: Partial<TestFormData>
}) {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      textField: '',
      numberField: 0,
      selectField: '',
      checkboxField: false,
      ...initialData,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <TextField
          form={form}
          name="textField"
          label="Text Field"
          required
          placeholder="Enter text"
        />
        <NumberField
          form={form}
          name="numberField"
          label="Number Field"
          required
          placeholder="Enter number"
          min={0}
        />
        <SelectField
          form={form}
          name="selectField"
          label="Select Field"
          required
          placeholder="Select option"
          options={[
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
            { value: 'option3', label: 'Option 3' },
          ]}
        />
        <CheckboxField
          form={form}
          name="checkboxField"
          label="Checkbox Field"
          description="Check this box"
        />
        <button 
          type="submit" 
          disabled={loading}
          data-testid="submit-button"
        >
          {loading ? 'Loading...' : 'Submit'}
        </button>
      </form>
    </Form>
  )
}

describe('Form Consistency Property Tests', () => {
  it('should display consistent validation errors for any invalid form data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          textField: fc.string({ maxLength: 0 }), // Invalid: empty string
          numberField: fc.integer({ max: -1 }), // Invalid: negative number
          selectField: fc.constant(''), // Invalid: empty selection
          submitAttempts: fc.integer({ min: 1, max: 3 }),
        }),
        async (config) => {
          const onSubmit = vi.fn()
          const user = userEvent.setup()

          render(
            <TestForm 
              onSubmit={onSubmit}
              initialData={config}
            />
          )

          // Attempt to submit multiple times to test consistency
          for (let i = 0; i < config.submitAttempts; i++) {
            const submitButton = screen.getByTestId('submit-button')
            await user.click(submitButton)

            // Wait for validation errors to appear
            await waitFor(() => {
              expect(screen.getByText('Text field is required')).toBeInTheDocument()
            })

            // Check that all validation errors are displayed consistently
            expect(screen.getByText('Text field is required')).toBeInTheDocument()
            expect(screen.getByText('Number must be positive')).toBeInTheDocument()
            expect(screen.getByText('Please select an option')).toBeInTheDocument()

            // Verify form was not submitted due to validation errors
            expect(onSubmit).not.toHaveBeenCalled()

            // Check that error styling is consistent
            const textInput = screen.getByLabelText(/text field/i)
            const numberInput = screen.getByLabelText(/number field/i)
            const selectTrigger = screen.getByRole('combobox')

            // All invalid fields should have error styling
            expect(textInput).toHaveAttribute('aria-invalid', 'true')
            expect(numberInput).toHaveAttribute('aria-invalid', 'true')
            expect(selectTrigger).toHaveAttribute('aria-invalid', 'true')
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should maintain consistent loading states across form submissions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          loadingDuration: fc.integer({ min: 100, max: 500 }),
          validData: fc.record({
            textField: fc.string({ minLength: 1, maxLength: 50 }),
            numberField: fc.integer({ min: 0, max: 1000 }),
            selectField: fc.constantFrom('option1', 'option2', 'option3'),
            checkboxField: fc.boolean(),
          }),
        }),
        async (config) => {
          let resolveSubmit: () => void
          const submitPromise = new Promise<void>((resolve) => {
            resolveSubmit = resolve
          })

          const onSubmit = vi.fn().mockImplementation(() => {
            setTimeout(resolveSubmit, config.loadingDuration)
            return submitPromise
          })

          const user = userEvent.setup()

          const { rerender } = render(
            <TestForm onSubmit={onSubmit} initialData={config.validData} />
          )

          const submitButton = screen.getByTestId('submit-button')
          
          // Initial state - button should be enabled
          expect(submitButton).not.toBeDisabled()
          expect(submitButton).toHaveTextContent('Submit')

          // Click submit to trigger loading state
          await user.click(submitButton)

          // Rerender with loading state
          rerender(
            <TestForm 
              onSubmit={onSubmit} 
              loading={true}
              initialData={config.validData} 
            />
          )

          // During loading - button should be disabled and show loading text
          expect(submitButton).toBeDisabled()
          expect(submitButton).toHaveTextContent('Loading...')

          // Wait for submission to complete
          await submitPromise

          // After loading - button should return to normal state
          rerender(
            <TestForm 
              onSubmit={onSubmit} 
              loading={false}
              initialData={config.validData} 
            />
          )

          expect(submitButton).not.toBeDisabled()
          expect(submitButton).toHaveTextContent('Submit')
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should provide consistent styling and interaction patterns across all form fields', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          textValue: fc.string({ minLength: 1, maxLength: 100 }),
          numberValue: fc.integer({ min: 0, max: 10000 }),
          selectValue: fc.constantFrom('option1', 'option2', 'option3'),
          checkboxValue: fc.boolean(),
          required: fc.boolean(),
        }),
        (config) => {
          const onSubmit = vi.fn()

          render(
            <TestForm 
              onSubmit={onSubmit}
              initialData={{
                textField: config.textValue,
                numberField: config.numberValue,
                selectField: config.selectValue,
                checkboxField: config.checkboxValue,
              }}
            />
          )

          // Check that all form fields have consistent labeling
          const textLabel = screen.getByText('Text Field')
          const numberLabel = screen.getByText('Number Field')
          const selectLabel = screen.getByText('Select Field')
          const checkboxLabel = screen.getByText('Checkbox Field')

          expect(textLabel).toBeInTheDocument()
          expect(numberLabel).toBeInTheDocument()
          expect(selectLabel).toBeInTheDocument()
          expect(checkboxLabel).toBeInTheDocument()

          // Check that required fields have consistent required indicators
          const requiredIndicators = screen.getAllByText('*')
          expect(requiredIndicators).toHaveLength(3) // text, number, and select fields

          // Check that form fields have consistent spacing and layout
          const formItems = screen.getAllByRole('group')
          formItems.forEach(item => {
            expect(item).toHaveClass('grid', 'gap-2')
          })

          // Check that inputs have consistent styling classes
          const textInput = screen.getByLabelText(/text field/i)
          const numberInput = screen.getByLabelText(/number field/i)
          
          // Both inputs should have similar base classes
          expect(textInput).toHaveClass('flex', 'h-9', 'w-full', 'rounded-md', 'border')
          expect(numberInput).toHaveClass('flex', 'h-9', 'w-full', 'rounded-md', 'border')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle form modal consistency across different configurations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 50 }),
          description: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          submitText: fc.string({ minLength: 1, maxLength: 20 }),
          cancelText: fc.string({ minLength: 1, maxLength: 20 }),
          size: fc.constantFrom('sm', 'md', 'lg', 'xl'),
        }),
        async (config) => {
          const onClose = vi.fn()
          const onSubmit = vi.fn()
          const user = userEvent.setup()

          render(
            <FormModal
              isOpen={true}
              onClose={onClose}
              title={config.title}
              description={config.description}
              size={config.size}
              onSubmit={onSubmit}
              submitText={config.submitText}
              cancelText={config.cancelText}
            >
              <TestForm onSubmit={onSubmit} />
            </FormModal>
          )

          // Check modal structure consistency
          expect(screen.getByRole('dialog')).toBeInTheDocument()
          expect(screen.getByText(config.title)).toBeInTheDocument()
          
          if (config.description) {
            expect(screen.getByText(config.description)).toBeInTheDocument()
          }

          // Check button consistency
          const cancelButton = screen.getByText(config.cancelText)
          const submitButton = screen.getByText(config.submitText)

          expect(cancelButton).toBeInTheDocument()
          expect(submitButton).toBeInTheDocument()

          // Test cancel functionality
          await user.click(cancelButton)
          expect(onClose).toHaveBeenCalled()
        }
      ),
      { numRuns: 50 }
    )
  })
})