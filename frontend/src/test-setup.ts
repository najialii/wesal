import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock window.dispatchEvent
Object.defineProperty(window, 'dispatchEvent', {
  value: vi.fn(),
  writable: true,
})

// Mock console methods to reduce noise in tests
globalThis.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
}