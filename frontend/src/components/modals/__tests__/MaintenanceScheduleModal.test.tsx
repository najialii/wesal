/**
 * **Feature: missing-frontend-views, Property 4: Contract-based auto-population**
 * Property-based test for maintenance contract auto-population
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fc } from 'fast-check'
import { MaintenanceScheduleModal } from '../MaintenanceScheduleModal'
import api from '../../../lib/api'

// Mock the API
vi.mock('../../../lib/api')
const mockedApi = vi.mocked(api)

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Maintenance Schedule Modal Contract Auto-population Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should auto-populate customer and product information when contract is selected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          contracts: fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              customer_name: fc.string({ minLength: 1, maxLength: 100 }),
              customer_phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
              customer_address: fc.option(fc.string({ minLength: 10, maxLength: 200 })),
              product: fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                name: fc.string({ minLength: 1, maxLength: 50 }),
              }),
              sale: fc.record({
                id: fc.integer({ min: 1, max: 1000 }),
                sale_number: fc.string({ minLength: 5, maxLength: 20 }).map(s => `INV-${s}`),
              }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          workers: fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              job_title: fc.string({ minLength: 1, maxLength: 30 }),
              phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
            }),
            { maxLength: 5 }
          ),
          selectedContractIndex: fc.integer({ min: 0, max: 9 }),
        }),
        async (config) => {
          // Ensure we have at least one contract and select a valid index
          if (config.contracts.length === 0) return
          const contractIndex = config.selectedContractIndex % config.contracts.length
          const selectedContract = config.contracts[contractIndex]

          const onClose = vi.fn()
          const onSuccess = vi.fn()
          const user = userEvent.setup()

          // Mock API responses
          mockedApi.get.mockImplementation((url) => {
            if (url === '/business/maintenance/contracts') {
              return Promise.resolve({ data: { contracts: config.contracts } })
            }
            if (url === '/business/maintenance/workers') {
              return Promise.resolve({ data: { workers: config.workers } })
            }
            return Promise.reject(new Error('Unknown endpoint'))
          })

          render(
            <MaintenanceScheduleModal
              isOpen={true}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )

          // Wait for initial data to load
          await waitFor(() => {
            expect(mockedApi.get).toHaveBeenCalledWith('/business/maintenance/contracts')
            expect(mockedApi.get).toHaveBeenCalledWith('/business/maintenance/workers')
          })

          // Wait for form to be ready
          await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /maintenance contract/i })).toBeInTheDocument()
          })

          // Select the contract
          const contractSelect = screen.getByRole('combobox', { name: /maintenance contract/i })
          await user.click(contractSelect)

          // Find and click the specific contract option
          const expectedOptionText = `${selectedContract.customer_name} - ${selectedContract.product.name} (${selectedContract.sale.sale_number})`
          
          await waitFor(() => {
            const option = screen.getByText(expectedOptionText)
            expect(option).toBeInTheDocument()
          })

          const contractOption = screen.getByText(expectedOptionText)
          await user.click(contractOption)

          // Wait for contract details to be populated
          await waitFor(() => {
            expect(screen.getByText('Contract Details')).toBeInTheDocument()
          })

          // Verify customer information is auto-populated
          expect(screen.getByText(selectedContract.customer_name)).toBeInTheDocument()
          expect(screen.getByText(selectedContract.product.name)).toBeInTheDocument()

          // Verify optional fields are displayed if present
          if (selectedContract.customer_phone) {
            expect(screen.getByText(selectedContract.customer_phone)).toBeInTheDocument()
          }

          if (selectedContract.customer_address) {
            expect(screen.getByText(selectedContract.customer_address)).toBeInTheDocument()
          }

          // Verify the contract details section contains all expected information
          const contractDetailsSection = screen.getByText('Contract Details').closest('div')
          expect(contractDetailsSection).toContainElement(screen.getByText(selectedContract.customer_name))
          expect(contractDetailsSection).toContainElement(screen.getByText(selectedContract.product.name))
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle contract selection changes correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          contracts: fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              customer_name: fc.string({ minLength: 1, maxLength: 50 }),
              customer_phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
              product: fc.record({
                id: fc.integer({ min: 1, max: 50 }),
                name: fc.string({ minLength: 1, maxLength: 30 }),
              }),
              sale: fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                sale_number: fc.string().map(s => `INV-${s}`),
              }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          firstSelection: fc.integer({ min: 0, max: 4 }),
          secondSelection: fc.integer({ min: 0, max: 4 }),
        }),
        async (config) => {
          if (config.contracts.length < 2) return

          const firstIndex = config.firstSelection % config.contracts.length
          const secondIndex = config.secondSelection % config.contracts.length
          
          // Skip if same contract selected
          if (firstIndex === secondIndex) return

          const firstContract = config.contracts[firstIndex]
          const secondContract = config.contracts[secondIndex]

          const onClose = vi.fn()
          const onSuccess = vi.fn()
          const user = userEvent.setup()

          mockedApi.get.mockImplementation((url) => {
            if (url === '/business/maintenance/contracts') {
              return Promise.resolve({ data: { contracts: config.contracts } })
            }
            if (url === '/business/maintenance/workers') {
              return Promise.resolve({ data: { workers: [] } })
            }
            return Promise.reject(new Error('Unknown endpoint'))
          })

          render(
            <MaintenanceScheduleModal
              isOpen={true}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )

          await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /maintenance contract/i })).toBeInTheDocument()
          })

          const contractSelect = screen.getByRole('combobox', { name: /maintenance contract/i })

          // Select first contract
          await user.click(contractSelect)
          const firstOptionText = `${firstContract.customer_name} - ${firstContract.product.name} (${firstContract.sale.sale_number})`
          
          await waitFor(() => {
            expect(screen.getByText(firstOptionText)).toBeInTheDocument()
          })
          
          await user.click(screen.getByText(firstOptionText))

          // Verify first contract details are shown
          await waitFor(() => {
            expect(screen.getByText(firstContract.customer_name)).toBeInTheDocument()
            expect(screen.getByText(firstContract.product.name)).toBeInTheDocument()
          })

          // Select second contract
          await user.click(contractSelect)
          const secondOptionText = `${secondContract.customer_name} - ${secondContract.product.name} (${secondContract.sale.sale_number})`
          
          await waitFor(() => {
            expect(screen.getByText(secondOptionText)).toBeInTheDocument()
          })
          
          await user.click(screen.getByText(secondOptionText))

          // Verify second contract details replace the first
          await waitFor(() => {
            expect(screen.getByText(secondContract.customer_name)).toBeInTheDocument()
            expect(screen.getByText(secondContract.product.name)).toBeInTheDocument()
          })

          // Verify first contract details are no longer shown (if different)
          if (firstContract.customer_name !== secondContract.customer_name) {
            expect(screen.queryByText(firstContract.customer_name)).not.toBeInTheDocument()
          }
          if (firstContract.product.name !== secondContract.product.name) {
            expect(screen.queryByText(firstContract.product.name)).not.toBeInTheDocument()
          }
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should handle empty contract list gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          workers: fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10 }),
              name: fc.string({ minLength: 1, maxLength: 20 }),
              job_title: fc.string({ minLength: 1, maxLength: 15 }),
            }),
            { maxLength: 3 }
          ),
        }),
        async (config) => {
          const onClose = vi.fn()
          const onSuccess = vi.fn()

          mockedApi.get.mockImplementation((url) => {
            if (url === '/business/maintenance/contracts') {
              return Promise.resolve({ data: { contracts: [] } })
            }
            if (url === '/business/maintenance/workers') {
              return Promise.resolve({ data: { workers: config.workers } })
            }
            return Promise.reject(new Error('Unknown endpoint'))
          })

          render(
            <MaintenanceScheduleModal
              isOpen={true}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )

          await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /maintenance contract/i })).toBeInTheDocument()
          })

          // Contract select should be present but empty
          const contractSelect = screen.getByRole('combobox', { name: /maintenance contract/i })
          expect(contractSelect).toBeInTheDocument()

          // No contract details should be shown
          expect(screen.queryByText('Contract Details')).not.toBeInTheDocument()

          // Form should still be functional for other fields
          expect(screen.getByLabelText(/scheduled date/i)).toBeInTheDocument()
          expect(screen.getByRole('combobox', { name: /priority/i })).toBeInTheDocument()
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should preserve form state when contract selection changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          contracts: fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 50 }),
              customer_name: fc.string({ minLength: 1, maxLength: 30 }),
              product: fc.record({
                name: fc.string({ minLength: 1, maxLength: 20 }),
              }),
              sale: fc.record({
                sale_number: fc.string().map(s => `INV-${s}`),
              }),
            }),
            { minLength: 2, maxLength: 3 }
          ),
          formData: fc.record({
            scheduled_date: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) })
              .map(d => d.toISOString().split('T')[0]),
            scheduled_time: fc.option(fc.string().map(() => '14:30')),
            priority: fc.constantFrom('low', 'medium', 'high', 'urgent'),
            work_description: fc.option(fc.string({ maxLength: 100 })),
          }),
        }),
        async (config) => {
          if (config.contracts.length < 2) return

          const onClose = vi.fn()
          const onSuccess = vi.fn()
          const user = userEvent.setup()

          mockedApi.get.mockImplementation((url) => {
            if (url === '/business/maintenance/contracts') {
              return Promise.resolve({ data: { contracts: config.contracts } })
            }
            if (url === '/business/maintenance/workers') {
              return Promise.resolve({ data: { workers: [] } })
            }
            return Promise.reject(new Error('Unknown endpoint'))
          })

          render(
            <MaintenanceScheduleModal
              isOpen={true}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )

          await waitFor(() => {
            expect(screen.getByLabelText(/scheduled date/i)).toBeInTheDocument()
          })

          // Fill in form fields
          const dateInput = screen.getByLabelText(/scheduled date/i)
          await user.clear(dateInput)
          await user.type(dateInput, config.formData.scheduled_date)

          if (config.formData.scheduled_time) {
            const timeInput = screen.getByLabelText(/scheduled time/i)
            await user.clear(timeInput)
            await user.type(timeInput, config.formData.scheduled_time)
          }

          const prioritySelect = screen.getByRole('combobox', { name: /priority/i })
          await user.click(prioritySelect)
          await user.click(screen.getByText(config.formData.priority.charAt(0).toUpperCase() + config.formData.priority.slice(1)))

          if (config.formData.work_description) {
            const descriptionInput = screen.getByLabelText(/work description/i)
            await user.type(descriptionInput, config.formData.work_description)
          }

          // Select first contract
          const contractSelect = screen.getByRole('combobox', { name: /maintenance contract/i })
          await user.click(contractSelect)
          
          const firstContract = config.contracts[0]
          const firstOptionText = `${firstContract.customer_name} - ${firstContract.product.name} (${firstContract.sale.sale_number})`
          
          await waitFor(() => {
            expect(screen.getByText(firstOptionText)).toBeInTheDocument()
          })
          await user.click(screen.getByText(firstOptionText))

          // Select second contract
          await user.click(contractSelect)
          const secondContract = config.contracts[1]
          const secondOptionText = `${secondContract.customer_name} - ${secondContract.product.name} (${secondContract.sale.sale_number})`
          
          await waitFor(() => {
            expect(screen.getByText(secondOptionText)).toBeInTheDocument()
          })
          await user.click(screen.getByText(secondOptionText))

          // Verify form fields are preserved
          expect(dateInput).toHaveValue(config.formData.scheduled_date)
          
          if (config.formData.scheduled_time) {
            expect(screen.getByLabelText(/scheduled time/i)).toHaveValue(config.formData.scheduled_time)
          }

          if (config.formData.work_description) {
            expect(screen.getByLabelText(/work description/i)).toHaveValue(config.formData.work_description)
          }

          // Priority should be preserved (check by looking at the select value)
          const updatedPrioritySelect = screen.getByRole('combobox', { name: /priority/i })
          expect(updatedPrioritySelect).toHaveAttribute('data-value', config.formData.priority)
        }
      ),
      { numRuns: 25 }
    )
  })
})