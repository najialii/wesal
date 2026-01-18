/**
 * RTLManager - Dedicated handler for Arabic RTL language support
 * Manages direction detection, CSS class management, and DOM updates
 */

export interface DirectionClasses {
  isRTL: boolean;
  container: string;
  text: string;
  margin: string;
  padding: string;
  border: string;
}

export interface RTLManager {
  // Direction management
  setDirection(locale: 'ar' | 'en'): void;
  isRTL(locale: 'ar' | 'en'): boolean;
  
  // CSS utilities
  getDirectionClasses(): DirectionClasses;
  updateDocumentDirection(isRTL: boolean): void;
  
  // Layout preservation
  preserveZIndex(): void;
  restoreZIndex(): void;
}

class RTLManagerImpl implements RTLManager {
  private savedZIndexes: Map<Element, string> = new Map();
  private currentDirection: 'ltr' | 'rtl' = 'ltr';

  /**
   * Set document direction based on locale
   */
  setDirection(locale: 'ar' | 'en'): void {
    const isRTL = this.isRTL(locale);
    this.updateDocumentDirection(isRTL);
    this.currentDirection = isRTL ? 'rtl' : 'ltr';
  }

  /**
   * Check if locale requires RTL direction
   */
  isRTL(locale: 'ar' | 'en'): boolean {
    return locale === 'ar';
  }

  /**
   * Get direction-aware CSS classes
   */
  getDirectionClasses(): DirectionClasses {
    const isRTL = this.currentDirection === 'rtl';
    
    return {
      isRTL,
      container: isRTL ? 'rtl-container' : 'ltr-container',
      text: isRTL ? 'rtl-text-start' : 'text-left',
      margin: isRTL ? 'rtl-margin-start-4' : 'ml-4',
      padding: isRTL ? 'rtl-padding-start-4' : 'pl-4',
      border: isRTL ? 'rtl-border-start' : 'border-l'
    };
  }

  /**
   * Update document direction and apply necessary changes
   */
  updateDocumentDirection(isRTL: boolean): void {
    const html = document.documentElement;
    const body = document.body;

    // Set direction attribute
    html.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    html.setAttribute('lang', isRTL ? 'ar' : 'en');

    // Update CSS classes
    if (isRTL) {
      html.classList.add('rtl');
      html.classList.remove('ltr');
      body.classList.add('rtl');
      body.classList.remove('ltr');
    } else {
      html.classList.add('ltr');
      html.classList.remove('rtl');
      body.classList.add('ltr');
      body.classList.remove('rtl');
    }

    // Set CSS custom properties for direction-aware styling
    html.style.setProperty('--direction', isRTL ? 'rtl' : 'ltr');
    html.style.setProperty('--text-align', isRTL ? 'right' : 'left');
    html.style.setProperty('--margin-start', isRTL ? 'margin-right' : 'margin-left');
    html.style.setProperty('--margin-end', isRTL ? 'margin-left' : 'margin-right');

    // Apply Arabic font for RTL
    if (isRTL) {
      html.style.setProperty('--font-family', "'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif");
      html.style.setProperty('--font-feature-settings', '"kern" 1, "liga" 1, "calt" 1, "curs" 1');
      html.style.setProperty('--text-rendering', 'optimizeLegibility');
    } else {
      html.style.setProperty('--font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
      html.style.removeProperty('--font-feature-settings');
      html.style.removeProperty('--text-rendering');
    }

    // Dispatch direction change event
    window.dispatchEvent(new CustomEvent('directionchange', {
      detail: { isRTL, direction: isRTL ? 'rtl' : 'ltr' }
    }));

    // Force layout recalculation for smooth transitions
    this.forceLayoutRecalculation();
  }

  /**
   * Preserve z-index values before direction change
   */
  preserveZIndex(): void {
    const elements = document.querySelectorAll('[style*="z-index"], .fixed, .absolute, .relative, .sticky');
    
    elements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const zIndex = computedStyle.zIndex;
      
      if (zIndex && zIndex !== 'auto') {
        this.savedZIndexes.set(element, zIndex);
      }
    });
  }

  /**
   * Restore z-index values after direction change
   */
  restoreZIndex(): void {
    this.savedZIndexes.forEach((zIndex, element) => {
      if (element instanceof HTMLElement) {
        element.style.zIndex = zIndex;
      }
    });
    
    this.savedZIndexes.clear();
  }

  /**
   * Force layout recalculation for smooth transitions
   */
  private forceLayoutRecalculation(): void {
    // Trigger reflow to ensure smooth transitions
    document.body.offsetHeight;
    
    // Add transition classes temporarily
    document.body.style.transition = 'all 0.3s ease-in-out';
    
    setTimeout(() => {
      document.body.style.transition = '';
    }, 300);
  }

  /**
   * Get current direction
   */
  getCurrentDirection(): 'ltr' | 'rtl' {
    return this.currentDirection;
  }

  /**
   * Apply Arabic text shaping and ligatures
   */
  applyArabicTextShaping(element: HTMLElement): void {
    if (this.currentDirection === 'rtl') {
      element.style.fontFeatureSettings = '"kern" 1, "liga" 1, "calt" 1, "curs" 1';
      element.style.textRendering = 'optimizeLegibility';
      element.style.unicodeBidi = 'embed';
      element.classList.add('arabic-text');
    }
  }

  /**
   * Handle bidirectional text for mixed content
   */
  handleBidirectionalText(element: HTMLElement): void {
    // Check if element contains mixed Arabic/English content
    const text = element.textContent || '';
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const hasLatin = /[a-zA-Z]/.test(text);
    
    if (hasArabic && hasLatin) {
      element.style.unicodeBidi = 'plaintext';
      element.classList.add('mixed-content');
    } else if (hasArabic) {
      element.style.unicodeBidi = 'embed';
      element.classList.add('arabic-flow');
    }
  }

  /**
   * Format Arabic numerals and dates
   */
  formatArabicContent(content: string, type: 'number' | 'date' | 'currency'): string {
    if (this.currentDirection !== 'rtl') {
      return content;
    }

    switch (type) {
      case 'number':
        // Convert to Arabic-Indic numerals if needed
        return content.replace(/[0-9]/g, (digit) => {
          const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
          return arabicNumerals[parseInt(digit)];
        });
      
      case 'date':
        // Format dates according to Arabic locale
        try {
          const date = new Date(content);
          return new Intl.DateTimeFormat('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }).format(date);
        } catch {
          return content;
        }
      
      case 'currency':
        // Format currency for Arabic locale
        try {
          const amount = parseFloat(content);
          return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR'
          }).format(amount);
        } catch {
          return content;
        }
      
      default:
        return content;
    }
  }

  /**
   * Initialize RTL manager with current locale
   */
  initialize(locale: 'ar' | 'en'): void {
    this.setDirection(locale);
    
    // Set up mutation observer for dynamic content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              this.handleBidirectionalText(node);
              if (this.currentDirection === 'rtl') {
                this.applyArabicTextShaping(node);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Export singleton instance
export const rtlManager = new RTLManagerImpl();
export default rtlManager;