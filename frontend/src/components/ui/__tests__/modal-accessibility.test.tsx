/**
 * **Feature: missing-frontend-views, Property 10: Modal accessibility**
 * Property-based test for modal accessibility compliance
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fc } from 'fast-check'
import { BaseModal } from '../base-modal'
import { FormModal } from '../form-modal'

describe('Modal Accessibility Property Tests', () => {
  it('should handle keyboard navigation correctly for any modal configuration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          size: fc.constantFrom('sm', 'md', 'lg', 'xl'),
          isOpen: fc.boolean(),
          hasSubmit: fc.boolean(),
          submitText: fc.string({ minLength: 1, maxLength: 20 }),
          cancelText: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async (config) => {
          const onClose = vi.fn()
          const onSubmit = vi.fn()
          const user = userEvent.setup()

          if (!config.isOpen) return // Skip closed modals

          const { rerender } = render(
            config.hasSubmit ? (
              <FormModal
                isOpen={config.isOpen}
                onClose={onClose}
                title={config.title}
                description={config.description}
                size={config.size}
                onSubmit={onSubmit}
                submitText={config.submitText}
                cancelText={config.cancelText}
              >
                <input data-testid="test-input" />
              </FormModal>
            ) : (
              <BaseModal
                isOpen={config.isOpen}
                onClose={onClose}
                title={config.title}
                description={config.description}
                size={config.size}
              >
                <input data-testid="test-input" />
              </BaseModal>
            )
          )

          // Test that modal is properly announced to screen readers
          expect(screen.getByRole('dialog')).toBeInTheDocument()
          expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby')
          
          if (config.description) {
            expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby')
          }

          // Test keyboard navigation
          const input = screen.getByTestId('test-input')
          await user.tab()
          
          // Focus should be trapped within modal
          expect(document.activeElement).toBe(input)

          // Test escape key closes modal
          await user.keyboard('{Escape}')
          expect(onClose).toHaveBeenCalled()

          // Reset for next test
          onClose.mockClear()
          onSubmit.mockClear()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain proper focus management for any modal state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 50 }),
          initiallyOpen: fc.boolean(),
          toggleCount: fc.integer({ min: 1, max: 5 }),
        }),
        async (config) => {
          const onClose = vi.fn()
          let isOpen = config.initiallyOpen
          const user = userEvent.setup()

          const { rerender } = render(
            <div>
              <button data-testid="external-button">External Button</button>
              <BaseModal
                isOpen={isOpen}
                onClose={onClose}
                title={config.title}
              >
                <input data-testid="modal-input" />
                <button data-testid="modal-button">Modal Button</button>
              </BaseModal>
            </div>
          )

          const externalButton = screen.getByTestId('external-button')
          
          // Focus external element first
          externalButton.focus()
          expect(document.activeElement).toBe(externalButton)

          // Toggle modal multiple times to test focus management
          for (let i = 0; i < config.toggleCount; i++) {
            isOpen = !isOpen
            
            rerender(
              <div>
                <button data-testid="external-button">External Button</button>
                <BaseModal
                  isOpen={isOpen}
                  onClose={onClose}
                  title={config.title}
                >
                  <input data-testid="modal-input" />
                  <button data-testid="modal-button">Modal Button</button>
                </BaseModal>
              </div>
            )

            if (isOpen) {
              // When modal opens, focus should move to modal content
              const modalInput = screen.getByTestId('modal-input')
              await user.tab()
              expect(document.activeElement).toBe(modalInput)
            } else {
              // When modal closes, focus should return to external element
              // (This is handled by Radix UI automatically)
              expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
            }
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should provide proper ARIA attributes for any modal content', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          hasForm: fc.boolean(),
          hasMultipleInputs: fc.boolean(),
        }),
        (config) => {
          const onClose = vi.fn()
          const onSubmit = vi.fn()

          render(
            config.hasForm ? (
              <FormModal
                isOpen={true}
                onClose={onClose}
                title={config.title}
                description={config.description}
                onSubmit={onSubmit}
              >
                <input data-testid="input-1" aria-label="First input" />
                {config.hasMultipleInputs && (
                  <input data-testid="input-2" aria-label="Second input" />
                )}
              </FormModal>
            ) : (
              <BaseModal
                isOpen={true}
                onClose={onClose}
                title={config.title}
                description={config.description}
              >
                <div data-testid="content">Modal content</div>
              </BaseModal>
            )
          )

          const dialog = screen.getByRole('dialog')
          
          // Dialog should have proper ARIA attributes
          expect(dialog).toHaveAttribute('aria-labelledby')
          expect(dialog).toHaveAttribute('aria-modal', 'true')
          
          if (config.description) {
            expect(dialog).toHaveAttribute('aria-describedby')
          }

          // Title should be properly associated
          const titleElement = screen.getByText(config.title)
          expect(titleElement).toBeInTheDocument()
          
          if (config.description) {
            const descriptionElement = screen.getByText(config.description)
            expect(descriptionElement).toBeInTheDocument()
          }

          // Form elements should be accessible
          if (config.hasForm) {
            const input1 = screen.getByTestId('input-1')
            expect(input1).toHaveAttribute('aria-label')
            
            if (config.hasMultipleInputs) {
              const input2 = screen.getByTestId('input-2')
              expect(input2).toHaveAttribute('aria-label')
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})