// Accessibility utilities and helpers for WesalTech platform
import * as React from 'react';

/**
 * Screen reader only text utility
 * Use for providing context to screen readers without visual display
 */
export function srOnly(text: string): React.ReactNode {
  return React.createElement('span', { className: 'sr-only' }, text);
}

/**
 * Generate accessible IDs for form elements
 */
export function generateId(prefix: string = 'field'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * ARIA live region announcer for dynamic content updates
 */
export class LiveAnnouncer {
  private static instance: LiveAnnouncer;
  private liveElement: HTMLElement | null = null;

  static getInstance(): LiveAnnouncer {
    if (!LiveAnnouncer.instance) {
      LiveAnnouncer.instance = new LiveAnnouncer();
    }
    return LiveAnnouncer.instance;
  }

  private constructor() {
    this.createLiveElement();
  }

  private createLiveElement(): void {
    if (typeof document === 'undefined') return;

    this.liveElement = document.createElement('div');
    this.liveElement.setAttribute('aria-live', 'polite');
    this.liveElement.setAttribute('aria-atomic', 'true');
    this.liveElement.className = 'sr-only';
    document.body.appendChild(this.liveElement);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveElement) return;

    this.liveElement.setAttribute('aria-live', priority);
    this.liveElement.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.liveElement) {
        this.liveElement.textContent = '';
      }
    }, 1000);
  }
}

/**
 * Focus management utilities
 */
export class FocusManager {
  /**
   * Trap focus within a container element
   */
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  /**
   * Restore focus to previously focused element
   */
  static createFocusRestorer(): () => void {
    const previouslyFocused = document.activeElement as HTMLElement;

    return () => {
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    };
  }
}

/**
 * Color contrast utilities
 */
export class ColorContrast {
  /**
   * Calculate relative luminance of a color
   */
  private static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Convert hex color to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Check if color combination meets WCAG AA standards
   */
  static meetsWCAGAA(foreground: string, background: string): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return ratio >= 4.5; // WCAG AA standard for normal text
  }

  /**
   * Check if color combination meets WCAG AAA standards
   */
  static meetsWCAGAAA(foreground: string, background: string): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return ratio >= 7; // WCAG AAA standard for normal text
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation in a list
   */
  static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onIndexChange: (index: number) => void
  ): void {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    onIndexChange(newIndex);
    items[newIndex]?.focus();
  }
}

/**
 * ARIA utilities
 */
export const ARIA = {
  /**
   * Generate ARIA attributes for form fields
   */
  formField: (id: string, hasError?: boolean, describedBy?: string) => ({
    id,
    'aria-invalid': hasError ? 'true' : 'false',
    'aria-describedby': describedBy,
  }),

  /**
   * Generate ARIA attributes for buttons
   */
  button: (pressed?: boolean, expanded?: boolean, controls?: string) => ({
    'aria-pressed': pressed !== undefined ? pressed.toString() : undefined,
    'aria-expanded': expanded !== undefined ? expanded.toString() : undefined,
    'aria-controls': controls,
  }),

  /**
   * Generate ARIA attributes for dialogs
   */
  dialog: (labelledBy?: string, describedBy?: string) => ({
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
  }),

  /**
   * Generate ARIA attributes for live regions
   */
  liveRegion: (level: 'polite' | 'assertive' = 'polite', atomic: boolean = true) => ({
    'aria-live': level,
    'aria-atomic': atomic.toString(),
  }),
};

/**
 * Initialize accessibility features
 */
export function initializeAccessibility(): void {
  // Initialize live announcer
  LiveAnnouncer.getInstance();

  // Add focus-visible polyfill behavior
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }
}

export default {
  LiveAnnouncer,
  FocusManager,
  ColorContrast,
  KeyboardNavigation,
  ARIA,
  initializeAccessibility,
  srOnly,
  generateId,
};