/**
 * **Feature: missing-frontend-views, Property 11: Detail view completeness**
 * Property-based test for sales detail modal completeness
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { fc } from 'fast-check'
import { SalesDetailModal } from '../SalesDetailModal'
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

describe('Sales Detail Modal Completeness Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display all required sale information for any valid sale data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          sale: fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            sale_number: fc.string({ minLength: 5, maxLength: 20 }).map(s => `INV-${s}`),
            customer_name: fc.string({ minLength: 1, maxLength: 100 }),
            customer_phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
            customer_tax_id: fc.option(fc.string({ minLength: 5, maxLength: 20 })),
            total_amount: fc.float({ min: 0.01, max: 10000 }),
            subtotal: fc.float({ min: 0.01, max: 9000 }),
            tax_amount: fc.float({ min: 0, max: 1000 }),
            discount_amount: fc.float({ min: 0, max: 500 }),
            payment_method: fc.constantFrom('cash', 'card', 'bank_transfer', 'credit'),
            payment_status: fc.constantFrom('paid', 'pending', 'failed'),
            sale_date: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
            notes: fc.option(fc.string({ maxLength: 500 })),
            salesman: fc.option(fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
            })),
            items: fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 1000 }),
                product_id: fc.integer({ min: 1, max: 100 }),
                quantity: fc.integer({ min: 1, max: 100 }),
                unit_price: fc.float({ min: 0.01, max: 1000 }),
                tax_rate: fc.float({ min: 0, max: 30 }),
                discount_amount: fc.float({ min: 0, max: 100 }),
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
          maintenance_contracts: fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              frequency: fc.constantFrom('weekly', 'monthly', 'quarterly', 'annual'),
              start_date: fc.date().map(d => d.toISOString()),
              end_date: fc.option(fc.date().map(d => d.toISOString())),
              status: fc.constantFrom('active', 'inactive', 'completed'),
              contract_value: fc.option(fc.float({ min: 0.01, max: 5000 })),
            }),
            { maxLength: 5 }
          ),
        }),
        async (data) => {
          const onClose = vi.fn()

          // Mock API response
          mockedApi.get.mockResolvedValueOnce({
            data: {
              sale: data.sale,
              maintenance_contracts: data.maintenance_contracts,
            }
          })

          render(
            <SalesDetailModal
              isOpen={true}
              onClose={onClose}
              saleId={data.sale.id}
            />
          )

          // Wait for API call and data loading
          await waitFor(() => {
            expect(mockedApi.get).toHaveBeenCalledWith(`/pos/sales/${data.sale.id}`)
          })

          // Wait for content to be rendered
          await waitFor(() => {
            expect(screen.getByText(data.sale.sale_number)).toBeInTheDocument()
          })

          // Verify sale header information
          expect(screen.getByText(data.sale.sale_number)).toBeInTheDocument()
          expect(screen.getByText(data.sale.payment_status.toUpperCase())).toBeInTheDocument()
          expect(screen.getByText(new Date(data.sale.sale_date).toLocaleDateString())).toBeInTheDocument()

          // Verify customer information
          expect(screen.getByText(data.sale.customer_name)).toBeInTheDocument()
          
          if (data.sale.customer_phone) {
            expect(screen.getByText(data.sale.customer_phone)).toBeInTheDocument()
          }
          
          if (data.sale.customer_tax_id) {
            expect(screen.getByText(data.sale.customer_tax_id)).toBeInTheDocument()
          }

          // Verify salesman information
          if (data.sale.salesman) {
            expect(screen.getByText(data.sale.salesman.name)).toBeInTheDocument()
          }

          // Verify payment information
          const paymentMethodLabels = {
            cash: 'Cash',
            card: 'Card',
            bank_transfer: 'Bank Transfer',
            credit: 'Credit'
          }
          expect(screen.getByText(paymentMethodLabels[data.sale.payment_method as keyof typeof paymentMethodLabels])).toBeInTheDocument()

          // Verify sale items
          expect(screen.getByText(`Sale Items (${data.sale.items.length})`)).toBeInTheDocument()
          
          data.sale.items.forEach((item) => {
            expect(screen.getByText(item.product.name)).toBeInTheDocument()
            expect(screen.getByText(`SKU: ${item.product.sku}`)).toBeInTheDocument()
            expect(screen.getByText(item.quantity.toString())).toBeInTheDocument()
            expect(screen.getByText(`$${Number(item.unit_price).toFixed(2)}`)).toBeInTheDocument()
            expect(screen.getByText(`${item.tax_rate}%`)).toBeInTheDocument()
            expect(screen.getByText(`$${Number(item.total_amount).toFixed(2)}`)).toBeInTheDocument()
          })

          // Verify payment summary
          expect(screen.getByText(`$${Number(data.sale.subtotal).toFixed(2)}`)).toBeInTheDocument()
          expect(screen.getByText(`$${Number(data.sale.tax_amount).toFixed(2)}`)).toBeInTheDocument()
          expect(screen.getByText(`$${Number(data.sale.total_amount).toFixed(2)}`)).toBeInTheDocument()
          
          if (Number(data.sale.discount_amount) > 0) {
            expect(screen.getByText(`-$${Number(data.sale.discount_amount).toFixed(2)}`)).toBeInTheDocument()
          }

          // Verify maintenance contracts if present
          if (data.maintenance_contracts.length > 0) {
            expect(screen.getByText('Maintenance Contracts')).toBeInTheDocument()
            
            data.maintenance_contracts.forEach((contract) => {
              expect(screen.getByText(`Contract #${contract.id}`)).toBeInTheDocument()
              expect(screen.getByText(contract.frequency)).toBeInTheDocument()
              expect(screen.getByText(contract.status)).toBeInTheDocument()
              expect(screen.getByText(new Date(contract.start_date).toLocaleDateString())).toBeInTheDocument()
              
              if (contract.contract_value) {
                expect(screen.getByText(`$${Number(contract.contract_value).toFixed(2)}`)).toBeInTheDocument()
              }
            })
          }

          // Verify notes if present
          if (data.sale.notes) {
            expect(screen.getByText('Notes')).toBeInTheDocument()
            expect(screen.getByText(data.sale.notes)).toBeInTheDocument()
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle missing optional fields gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          sale: fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            sale_number: fc.string().map(s => `INV-${s}`),
            customer_name: fc.string({ minLength: 1, maxLength: 50 }),
            // Intentionally omit optional fields
            total_amount: fc.float({ min: 0.01, max: 1000 }),
            subtotal: fc.float({ min: 0.01, max: 900 }),
            tax_amount: fc.float({ min: 0, max: 100 }),
            discount_amount: fc.constant(0),
            payment_method: fc.constantFrom('cash', 'card'),
            payment_status: fc.constantFrom('paid', 'pending'),
            sale_date: fc.date().map(d => d.toISOString()),
            items: fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                product_id: fc.integer({ min: 1, max: 50 }),
                quantity: fc.integer({ min: 1, max: 10 }),
                unit_price: fc.float({ min: 0.01, max: 100 }),
                tax_rate: fc.float({ min: 0, max: 15 }),
                discount_amount: fc.constant(0),
                total_amount: fc.float({ min: 0.01, max: 1000 }),
                product: fc.record({
                  id: fc.integer({ min: 1, max: 50 }),
                  name: fc.string({ minLength: 1, maxLength: 30 }),
                  sku: fc.string({ minLength: 3, maxLength: 10 }),
                }),
              }),
              { minLength: 1, maxLength: 5 }
            ),
          }),
          maintenance_contracts: fc.constant([]), // No maintenance contracts
        }),
        async (data) => {
          const onClose = vi.fn()

          mockedApi.get.mockResolvedValueOnce({
            data: {
              sale: data.sale,
              maintenance_contracts: data.maintenance_contracts,
            }
          })

          render(
            <SalesDetailModal
              isOpen={true}
              onClose={onClose}
              saleId={data.sale.id}
            />
          )

          await waitFor(() => {
            expect(screen.getByText(data.sale.sale_number)).toBeInTheDocument()
          })

          // Should still display required information
          expect(screen.getByText(data.sale.customer_name)).toBeInTheDocument()
          expect(screen.getByText(`$${Number(data.sale.total_amount).toFixed(2)}`)).toBeInTheDocument()

          // Should not display optional sections that are empty
          expect(screen.queryByText('Maintenance Contracts')).not.toBeInTheDocument()
          expect(screen.queryByText('Notes')).not.toBeInTheDocument()

          // Should not display discount if zero
          if (Number(data.sale.discount_amount) === 0) {
            expect(screen.queryByText(/Discount:/)).not.toBeInTheDocument()
          }
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should display consistent formatting for monetary values', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          sale: fc.record({
            id: fc.integer({ min: 1, max: 100 }),
            sale_number: fc.string().map(s => `INV-${s}`),
            customer_name: fc.string({ minLength: 1, maxLength: 30 }),
            total_amount: fc.float({ min: 0.01, max: 10000 }),
            subtotal: fc.float({ min: 0.01, max: 9000 }),
            tax_amount: fc.float({ min: 0, max: 1000 }),
            discount_amount: fc.float({ min: 0, max: 500 }),
            payment_method: fc.constantFrom('cash', 'card'),
            payment_status: fc.constantFrom('paid', 'pending'),
            sale_date: fc.date().map(d => d.toISOString()),
            items: fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                quantity: fc.integer({ min: 1, max: 10 }),
                unit_price: fc.float({ min: 0.01, max: 100 }),
                tax_rate: fc.float({ min: 0, max: 30 }),
                discount_amount: fc.float({ min: 0, max: 50 }),
                total_amount: fc.float({ min: 0.01, max: 1000 }),
                product: fc.record({
                  name: fc.string({ minLength: 1, maxLength: 20 }),
                  sku: fc.string({ minLength: 3, maxLength: 10 }),
                }),
              }),
              { minLength: 1, maxLength: 3 }
            ),
          }),
        }),
        (data) => {
          const onClose = vi.fn()

          mockedApi.get.mockResolvedValueOnce({
            data: { sale: data.sale, maintenance_contracts: [] }
          })

          render(
            <SalesDetailModal
              isOpen={true}
              onClose={onClose}
              saleId={data.sale.id}
            />
          )

          // All monetary values should be formatted to 2 decimal places
          const monetaryRegex = /\$\d+\.\d{2}/

          // Check that all displayed monetary values follow the format
          const monetaryElements = screen.getAllByText(monetaryRegex)
          expect(monetaryElements.length).toBeGreaterThan(0)

          // Verify specific monetary values are formatted correctly
          expect(screen.getByText(`$${Number(data.sale.total_amount).toFixed(2)}`)).toBeInTheDocument()
          expect(screen.getByText(`$${Number(data.sale.subtotal).toFixed(2)}`)).toBeInTheDocument()
          expect(screen.getByText(`$${Number(data.sale.tax_amount).toFixed(2)}`)).toBeInTheDocument()

          data.sale.items.forEach((item) => {
            expect(screen.getByText(`$${Number(item.unit_price).toFixed(2)}`)).toBeInTheDocument()
            expect(screen.getByText(`$${Number(item.total_amount).toFixed(2)}`)).toBeInTheDocument()
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle API errors gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          saleId: fc.integer({ min: 1, max: 1000 }),
          errorStatus: fc.constantFrom(404, 500, 403),
          errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async (config) => {
          const onClose = vi.fn()

          mockedApi.get.mockRejectedValueOnce({
            response: {
              status: config.errorStatus,
              data: { message: config.errorMessage }
            }
          })

          render(
            <SalesDetailModal
              isOpen={true}
              onClose={onClose}
              saleId={config.saleId}
            />
          )

          await waitFor(() => {
            expect(mockedApi.get).toHaveBeenCalledWith(`/pos/sales/${config.saleId}`)
          })

          // Modal should close on error
          await waitFor(() => {
            expect(onClose).toHaveBeenCalled()
          })
        }
      ),
      { numRuns: 20 }
    )
  })
})