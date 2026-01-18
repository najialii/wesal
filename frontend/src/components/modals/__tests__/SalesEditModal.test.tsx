/**
 * **Feature: missing-frontend-views, Property 1: Form edit pre-population**
 * Property-based test for sales edit form pre-population
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { fc } from 'fast-check'
import { SalesEditModal } from '../SalesEditModal'
import api from '@/lib/api'

// Mock the API
vi.mock('@/lib/api')
const mockedApi = vi.mocked(api)

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Sales Edit Modal Pre-population Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should pre-populate form with correct data for any valid sale', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          sale_number: fc.string({ minLength: 5, maxLength: 20 }).map(s => `INV-${s}`),
          customer_name: fc.string({ minLength: 1, maxLength: 100 }),
          customer_phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
          total_amount: fc.float({ min: 0.01, max: 10000 }),
          payment_method: fc.constantFrom('cash', 'card', 'bank_transfer', 'credit'),
          payment_status: fc.constantFrom('paid', 'pending', 'failed'),
          sale_date: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
          notes: fc.option(fc.string({ maxLength: 500 })),
          items: fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              product_id: fc.integer({ min: 1, max: 100 }),
              quantity: fc.integer({ min: 1, max: 100 }),
              unit_price: fc.float({ min: 0.01, max: 1000 }),
              total_amount: fc.float({ min: 0.01, max: 10000 }),
              product: fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                sku: fc.string({ minLength: 3, maxLength: 20 }),
              }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        async (saleData) => {
          const onClose = vi.fn()
          const onSuccess = vi.fn()

          // Mock API response
          mockedApi.get.mockResolvedValueOnce({
            data: { sale: saleData }
          })

          render(
            <SalesEditModal
              isOpen={true}
              onClose={onClose}
              saleId={saleData.id}
              onSuccess={onSuccess}
            />
          )

          // Wait for API call and form population
          await waitFor(() => {
            expect(mockedApi.get).toHaveBeenCalledWith(`/pos/sales/${saleData.id}`)
          })

          // Wait for form to be populated
          await waitFor(() => {
            expect(screen.getByDisplayValue(saleData.customer_name)).toBeInTheDocument()
          })

          // Verify all form fields are pre-populated correctly
          expect(screen.getByDisplayValue(saleData.customer_name)).toBeInTheDocument()
          
          if (saleData.customer_phone) {
            expect(screen.getByDisplayValue(saleData.customer_phone)).toBeInTheDocument()
          }

          // Check payment method selection
          const paymentMethodSelect = screen.getByRole('combobox', { name: /payment method/i })
          expect(paymentMethodSelect).toHaveAttribute('data-value', saleData.payment_method)

          // Check payment status selection
          const paymentStatusSelect = screen.getByRole('combobox', { name: /payment status/i })
          expect(paymentStatusSelect).toHaveAttribute('data-value', saleData.payment_status)

          if (saleData.notes) {
            expect(screen.getByDisplayValue(saleData.notes)).toBeInTheDocument()
          }

          // Verify sale information display
          expect(screen.getByText(saleData.sale_number)).toBeInTheDocument()
          expect(screen.getByText(`$${Number(saleData.total_amount).toFixed(2)}`)).toBeInTheDocument()
          expect(screen.getByText(`${saleData.items.length} items`)).toBeInTheDocument()

          // Verify sale items are displayed
          saleData.items.forEach((item) => {
            expect(screen.getByText(item.product.name)).toBeInTheDocument()
            expect(screen.getByText(`(${item.product.sku})`)).toBeInTheDocument()
            expect(screen.getByText(`$${Number(item.total_amount).toFixed(2)}`)).toBeInTheDocument()
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle API errors gracefully when fetching sale data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          saleId: fc.integer({ min: 1, max: 10000 }),
          errorStatus: fc.constantFrom(404, 500, 403),
          errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async (config) => {
          const onClose = vi.fn()
          const onSuccess = vi.fn()

          // Mock API error
          mockedApi.get.mockRejectedValueOnce({
            response: {
              status: config.errorStatus,
              data: { message: config.errorMessage }
            }
          })

          render(
            <SalesEditModal
              isOpen={true}
              onClose={onClose}
              saleId={config.saleId}
              onSuccess={onSuccess}
            />
          )

          // Wait for API call
          await waitFor(() => {
            expect(mockedApi.get).toHaveBeenCalledWith(`/pos/sales/${config.saleId}`)
          })

          // Modal should close on error
          await waitFor(() => {
            expect(onClose).toHaveBeenCalled()
          })
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should maintain form state consistency during re-population', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initialSale: fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            sale_number: fc.string().map(s => `INV-${s}`),
            customer_name: fc.string({ minLength: 1, maxLength: 50 }),
            customer_phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
            payment_method: fc.constantFrom('cash', 'card', 'bank_transfer', 'credit'),
            payment_status: fc.constantFrom('paid', 'pending', 'failed'),
            notes: fc.option(fc.string({ maxLength: 200 })),
            total_amount: fc.float({ min: 0.01, max: 1000 }),
            sale_date: fc.date().map(d => d.toISOString()),
            items: fc.array(fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              product: fc.record({
                name: fc.string({ minLength: 1, maxLength: 30 }),
                sku: fc.string({ minLength: 3, maxLength: 10 }),
              }),
              quantity: fc.integer({ min: 1, max: 10 }),
              unit_price: fc.float({ min: 0.01, max: 100 }),
              total_amount: fc.float({ min: 0.01, max: 1000 }),
            }), { minLength: 1, maxLength: 5 }),
          }),
          updatedSale: fc.record({
            customer_name: fc.string({ minLength: 1, maxLength: 50 }),
            customer_phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
            payment_method: fc.constantFrom('cash', 'card', 'bank_transfer', 'credit'),
            payment_status: fc.constantFrom('paid', 'pending', 'failed'),
            notes: fc.option(fc.string({ maxLength: 200 })),
          }),
        }),
        async (config) => {
          const onClose = vi.fn()
          const onSuccess = vi.fn()

          // Mock initial API response
          mockedApi.get.mockResolvedValueOnce({
            data: { sale: config.initialSale }
          })

          const { rerender } = render(
            <SalesEditModal
              isOpen={true}
              onClose={onClose}
              saleId={config.initialSale.id}
              onSuccess={onSuccess}
            />
          )

          // Wait for initial population
          await waitFor(() => {
            expect(screen.getByDisplayValue(config.initialSale.customer_name)).toBeInTheDocument()
          })

          // Mock updated API response
          const updatedSaleData = { ...config.initialSale, ...config.updatedSale }
          mockedApi.get.mockResolvedValueOnce({
            data: { sale: updatedSaleData }
          })

          // Simulate re-opening modal with updated data
          rerender(
            <SalesEditModal
              isOpen={false}
              onClose={onClose}
              saleId={config.initialSale.id}
              onSuccess={onSuccess}
            />
          )

          rerender(
            <SalesEditModal
              isOpen={true}
              onClose={onClose}
              saleId={config.initialSale.id}
              onSuccess={onSuccess}
            />
          )

          // Wait for updated population
          await waitFor(() => {
            expect(screen.getByDisplayValue(config.updatedSale.customer_name)).toBeInTheDocument()
          })

          // Verify updated data is displayed
          expect(screen.getByDisplayValue(config.updatedSale.customer_name)).toBeInTheDocument()
          
          if (config.updatedSale.customer_phone) {
            expect(screen.getByDisplayValue(config.updatedSale.customer_phone)).toBeInTheDocument()
          }

          if (config.updatedSale.notes) {
            expect(screen.getByDisplayValue(config.updatedSale.notes)).toBeInTheDocument()
          }
        }
      ),
      { numRuns: 30 }
    )
  })
})