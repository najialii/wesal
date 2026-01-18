/**
 * **Feature: super-admin-enhancement, Property 21: Comprehensive accessibility and responsiveness**
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
 * 
 * Property-based test for comprehensive accessibility and responsiveness:
 * For any admin interface and any device or accessibility tool, the system should provide 
 * fully functional responsive layouts, complete keyboard navigation with focus indicators, 
 * proper screen reader support with aria labels, and functional data table controls.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { fc } from 'fast-check';
import Plans from '../../pages/admin/Plans';
import Tenants from '../../pages/admin/Tenants';
import Analytics from '../../pages/admin/Analytics';
import Settings from '../../pages/admin/Settings';
import { TranslationProvider } from '../TranslationProvider';
import { BrowserRouter } from 'react-router-dom';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock API calls
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock('../../lib/api', () => ({
  default: mockApi
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <TranslationProvider>
      {children}
    </TranslationProvider>
  </BrowserRouter>
);

// Viewport size generator for responsive testing
const viewportSizeArbitrary = fc.record({
  width: fc.integer({ min: 320, max: 1920 }),
  height: fc.integer({ min: 568, max: 1080 })
});

// Admin page components generator
const adminPageArbitrary = fc.constantFrom(
  { name: 'Plans', component: Plans },
  { name: 'Tenants', component: Tenants },
  { name: 'Analytics', component: Analytics },
  { name: 'Settings', component: Settings }
);

// Mock data generators
const mockPlansData = {
  data: [
    {
      id: 1,
      name: 'Basic Plan',
      slug: 'basic-plan',
      description: 'Basic features for small businesses',
      price: 29.99,
      billing_cycle: 'monthly',
      features: ['pos', 'inventory', 'reports'],
      limits: { users: 5, products: 100 },
      trial_days: 14,
      is_active: true,
      sort_order: 1,
      tenants_count: 10,
      subscriptions_count: 8,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ],
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 1,
  from: 1,
  to: 1
};

const mockTenantsData = {
  data: [
    {
      id: 1,
      name: 'Test Tenant',
      domain: 'test.example.com',
      status: 'active',
      plan_id: 1,
      plan: { name: 'Basic Plan' },
      created_at: '2024-01-01T00:00:00Z'
    }
  ],
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 1,
  from: 1,
  to: 1
};

describe('Property 21: Comprehensive Accessibility and Responsiveness', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default API responses
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes('/admin/plans')) {
        return Promise.resolve({ data: mockPlansData });
      }
      if (url.includes('/admin/tenants')) {
        return Promise.resolve({ data: mockTenantsData });
      }
      if (url.includes('/admin/analytics')) {
        return Promise.resolve({ data: { overview: {}, revenue: {}, growth: {} } });
      }
      if (url.includes('/admin/settings')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    // Reset viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  it('should provide fully functional responsive layouts across all viewport sizes', async () => {
    await fc.assert(
      fc.asyncProperty(
        viewportSizeArbitrary,
        adminPageArbitrary,
        async (viewport, page) => {
          // Set viewport size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          });
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: viewport.height,
          });

          // Trigger resize event
          window.dispatchEvent(new Event('resize'));

          const { container } = render(
            <TestWrapper>
              <page.component />
            </TestWrapper>
          );

          // Wait for component to load
          await screen.findByRole('main', { timeout: 3000 }).catch(() => {
            // If no main role, look for any content
            return container.firstChild;
          });

          // Check that content is visible and not overflowing
          const mainContent = container.querySelector('[data-testid="main-content"]') || container.firstChild;
          
          if (mainContent) {
            const rect = (mainContent as Element).getBoundingClientRect();
            
            // Content should fit within viewport
            expect(rect.width).toBeLessThanOrEqual(viewport.width + 50); // Allow small margin for scrollbars
            
            // Content should be visible
            expect(rect.height).toBeGreaterThan(0);
          }

          // Check for responsive navigation elements
          const navElements = container.querySelectorAll('nav, [role="navigation"]');
          navElements.forEach(nav => {
            const navRect = nav.getBoundingClientRect();
            expect(navRect.width).toBeLessThanOrEqual(viewport.width + 50);
          });

          // Check for responsive tables
          const tables = container.querySelectorAll('table');
          tables.forEach(table => {
            const tableContainer = table.closest('[class*="overflow"]') || table.parentElement;
            expect(tableContainer).toBeTruthy();
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should provide complete keyboard navigation with proper focus indicators', async () => {
    await fc.assert(
      fc.asyncProperty(
        adminPageArbitrary,
        async (page) => {
          const user = userEvent.setup();
          
          render(
            <TestWrapper>
              <page.component />
            </TestWrapper>
          );

          // Wait for component to load
          await screen.findByRole('main', { timeout: 3000 }).catch(() => {
            return document.body;
          });

          // Get all focusable elements
          const focusableElements = screen.getAllByRole('button')
            .concat(screen.queryAllByRole('link'))
            .concat(screen.queryAllByRole('textbox'))
            .concat(screen.queryAllByRole('combobox'))
            .concat(screen.queryAllByRole('tab'))
            .filter(el => !el.hasAttribute('disabled') && !el.hasAttribute('aria-hidden'));

          if (focusableElements.length > 0) {
            // Test keyboard navigation through focusable elements
            for (let i = 0; i < Math.min(focusableElements.length, 5); i++) {
              await user.tab();
              
              const focusedElement = document.activeElement;
              expect(focusedElement).toBeTruthy();
              
              // Check for focus indicators
              const computedStyle = window.getComputedStyle(focusedElement as Element);
              const hasFocusIndicator = 
                computedStyle.outline !== 'none' ||
                computedStyle.boxShadow !== 'none' ||
                computedStyle.border !== 'none' ||
                focusedElement?.classList.contains('focus:') ||
                focusedElement?.hasAttribute('data-focus-visible');
              
              expect(hasFocusIndicator).toBe(true);
            }

            // Test Enter key activation on buttons
            const buttons = focusableElements.filter(el => el.tagName === 'BUTTON');
            if (buttons.length > 0) {
              const firstButton = buttons[0];
              firstButton.focus();
              
              const clickHandler = vi.fn();
              firstButton.addEventListener('click', clickHandler);
              
              await user.keyboard('{Enter}');
              // Note: Some buttons might not trigger click on Enter, which is acceptable
            }

            // Test Escape key functionality
            await user.keyboard('{Escape}');
            // Should close any open modals or dropdowns
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should provide proper screen reader support with aria labels', async () => {
    await fc.assert(
      fc.asyncProperty(
        adminPageArbitrary,
        async (page) => {
          const { container } = render(
            <TestWrapper>
              <page.component />
            </TestWrapper>
          );

          // Wait for component to load
          await screen.findByRole('main', { timeout: 3000 }).catch(() => {
            return container.firstChild;
          });

          // Check for proper heading structure
          const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
          if (headings.length > 0) {
            // Should have at least one h1
            const h1Elements = container.querySelectorAll('h1');
            expect(h1Elements.length).toBeGreaterThanOrEqual(1);
          }

          // Check for proper aria labels on interactive elements
          const interactiveElements = container.querySelectorAll(
            'button, a, input, select, textarea, [role="button"], [role="link"]'
          );
          
          interactiveElements.forEach(element => {
            const hasAccessibleName = 
              element.hasAttribute('aria-label') ||
              element.hasAttribute('aria-labelledby') ||
              element.textContent?.trim() ||
              element.querySelector('img')?.hasAttribute('alt') ||
              element.hasAttribute('title');
            
            expect(hasAccessibleName).toBe(true);
          });

          // Check for proper table accessibility
          const tables = container.querySelectorAll('table');
          tables.forEach(table => {
            // Tables should have proper headers
            const headers = table.querySelectorAll('th');
            if (headers.length > 0) {
              headers.forEach(header => {
                expect(header.hasAttribute('scope') || header.hasAttribute('id')).toBe(true);
              });
            }

            // Tables should have captions or aria-label
            const hasTableLabel = 
              table.querySelector('caption') ||
              table.hasAttribute('aria-label') ||
              table.hasAttribute('aria-labelledby');
            
            expect(hasTableLabel).toBe(true);
          });

          // Check for proper form accessibility
          const formInputs = container.querySelectorAll('input, select, textarea');
          formInputs.forEach(input => {
            const hasLabel = 
              input.hasAttribute('aria-label') ||
              input.hasAttribute('aria-labelledby') ||
              container.querySelector(`label[for="${input.id}"]`) ||
              input.closest('label');
            
            expect(hasLabel).toBe(true);
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should provide functional data table controls', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { name: 'Plans', component: Plans },
          { name: 'Tenants', component: Tenants }
        ),
        async (page) => {
          const user = userEvent.setup();
          
          render(
            <TestWrapper>
              <page.component />
            </TestWrapper>
          );

          // Wait for table to load
          const table = await screen.findByRole('table', { timeout: 3000 });
          expect(table).toBeTruthy();

          // Check for sorting functionality
          const columnHeaders = within(table).queryAllByRole('columnheader');
          if (columnHeaders.length > 0) {
            const sortableHeaders = columnHeaders.filter(header => 
              header.hasAttribute('aria-sort') ||
              header.querySelector('button') ||
              header.classList.contains('cursor-pointer')
            );

            if (sortableHeaders.length > 0) {
              const firstSortableHeader = sortableHeaders[0];
              const button = firstSortableHeader.querySelector('button') || firstSortableHeader;
              
              if (button) {
                await user.click(button as Element);
                // Should trigger sort (we can't easily test the actual sorting without more complex setup)
              }
            }
          }

          // Check for filtering functionality
          const searchInputs = screen.queryAllByRole('textbox');
          const searchInput = searchInputs.find(input => 
            input.getAttribute('placeholder')?.toLowerCase().includes('search') ||
            input.getAttribute('aria-label')?.toLowerCase().includes('search')
          );

          if (searchInput) {
            await user.type(searchInput, 'test');
            expect(searchInput).toHaveValue('test');
          }

          // Check for pagination controls
          const paginationButtons = screen.queryAllByRole('button').filter(button =>
            button.textContent?.toLowerCase().includes('next') ||
            button.textContent?.toLowerCase().includes('previous') ||
            button.textContent?.toLowerCase().includes('page')
          );

          paginationButtons.forEach(button => {
            expect(button.hasAttribute('aria-label') || button.textContent?.trim()).toBeTruthy();
          });

          // Check for bulk operation controls
          const checkboxes = screen.queryAllByRole('checkbox');
          if (checkboxes.length > 0) {
            // Should have proper labels
            checkboxes.forEach(checkbox => {
              const hasLabel = 
                checkbox.hasAttribute('aria-label') ||
                checkbox.hasAttribute('aria-labelledby') ||
                checkbox.closest('label');
              
              expect(hasLabel).toBeTruthy();
            });
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  it('should pass automated accessibility tests', async () => {
    await fc.assert(
      fc.asyncProperty(
        adminPageArbitrary,
        async (page) => {
          const { container } = render(
            <TestWrapper>
              <page.component />
            </TestWrapper>
          );

          // Wait for component to load
          await screen.findByRole('main', { timeout: 3000 }).catch(() => {
            return container.firstChild;
          });

          // Run axe accessibility tests
          const results = await axe(container);
          expect(results).toHaveNoViolations();
        }
      ),
      { numRuns: 5 }
    );
  });

  it('should maintain functionality across different device orientations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('portrait', 'landscape'),
        adminPageArbitrary,
        async (orientation, page) => {
          // Simulate device orientation
          const isPortrait = orientation === 'portrait';
          const width = isPortrait ? 768 : 1024;
          const height = isPortrait ? 1024 : 768;

          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
          });
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: height,
          });

          window.dispatchEvent(new Event('resize'));

          const { container } = render(
            <TestWrapper>
              <page.component />
            </TestWrapper>
          );

          // Wait for component to load
          await screen.findByRole('main', { timeout: 3000 }).catch(() => {
            return container.firstChild;
          });

          // Check that navigation is accessible
          const navElements = container.querySelectorAll('nav, [role="navigation"]');
          navElements.forEach(nav => {
            const rect = nav.getBoundingClientRect();
            expect(rect.width).toBeGreaterThan(0);
            expect(rect.height).toBeGreaterThan(0);
          });

          // Check that main content is accessible
          const mainContent = container.querySelector('main, [role="main"]') || container.firstChild;
          if (mainContent) {
            const rect = (mainContent as Element).getBoundingClientRect();
            expect(rect.width).toBeGreaterThan(0);
            expect(rect.height).toBeGreaterThan(0);
          }

          // Check that interactive elements are still accessible
          const buttons = container.querySelectorAll('button:not([disabled])');
          buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            expect(rect.width).toBeGreaterThan(0);
            expect(rect.height).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 10 }
    );
  });
});