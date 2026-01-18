/**
 * RTL layout testing helpers
 */

import type { RTLLayoutValidationResult } from './translationTestUtils';

export interface RTLTestElement {
  element: HTMLElement;
  expectedDirection: 'ltr' | 'rtl';
  testName: string;
}

export class RTLTestHelpers {
  /**
   * Create a test element with Arabic text
   */
  static createArabicTestElement(text: string = 'النص العربي للاختبار'): HTMLElement {
    const element = document.createElement('div');
    element.textContent = text;
    element.setAttribute('dir', 'rtl');
    element.style.direction = 'rtl';
    element.style.textAlign = 'right';
    element.style.fontFamily = 'Tajawal, Arial, sans-serif';
    element.style.fontFeatureSettings = '"kern" 1, "liga" 1, "calt" 1, "curs" 1';
    element.style.textRendering = 'optimizeLegibility';
    element.style.unicodeBidi = 'embed';
    
    return element;
  }

  /**
   * Create a test element with English text
   */
  static createEnglishTestElement(text: string = 'English test text'): HTMLElement {
    const element = document.createElement('div');
    element.textContent = text;
    element.setAttribute('dir', 'ltr');
    element.style.direction = 'ltr';
    element.style.textAlign = 'left';
    element.style.fontFamily = 'Arial, sans-serif';
    
    return element;
  }

  /**
   * Create a test element with mixed Arabic/English content
   */
  static createMixedContentTestElement(
    arabicText: string = 'النص العربي',
    englishText: string = 'English Text'
  ): HTMLElement {
    const element = document.createElement('div');
    element.textContent = `${arabicText} ${englishText}`;
    element.setAttribute('dir', 'rtl');
    element.style.direction = 'rtl';
    element.style.unicodeBidi = 'plaintext';
    element.classList.add('mixed-content');
    
    return element;
  }

  /**
   * Test RTL layout for form elements
   */
  static createRTLFormTestElements(): RTLTestElement[] {
    const elements: RTLTestElement[] = [];

    // Input field
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'النص العربي';
    input.setAttribute('dir', 'rtl');
    input.style.textAlign = 'right';
    elements.push({
      element: input,
      expectedDirection: 'rtl',
      testName: 'RTL Input Field'
    });

    // Textarea
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'النص العربي الطويل';
    textarea.setAttribute('dir', 'rtl');
    textarea.style.textAlign = 'right';
    elements.push({
      element: textarea,
      expectedDirection: 'rtl',
      testName: 'RTL Textarea'
    });

    // Label
    const label = document.createElement('label');
    label.textContent = 'تسمية عربية';
    label.setAttribute('dir', 'rtl');
    label.style.textAlign = 'right';
    elements.push({
      element: label,
      expectedDirection: 'rtl',
      testName: 'RTL Label'
    });

    return elements;
  }

  /**
   * Test RTL layout for navigation elements
   */
  static createRTLNavigationTestElements(): RTLTestElement[] {
    const elements: RTLTestElement[] = [];

    // Navigation menu
    const nav = document.createElement('nav');
    nav.setAttribute('dir', 'rtl');
    nav.style.direction = 'rtl';
    
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.padding = '0';
    
    ['الرئيسية', 'المنتجات', 'الخدمات', 'اتصل بنا'].forEach(text => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.textContent = text;
      a.href = '#';
      a.style.textAlign = 'right';
      li.appendChild(a);
      ul.appendChild(li);
    });
    
    nav.appendChild(ul);
    elements.push({
      element: nav,
      expectedDirection: 'rtl',
      testName: 'RTL Navigation Menu'
    });

    // Breadcrumb
    const breadcrumb = document.createElement('div');
    breadcrumb.setAttribute('dir', 'rtl');
    breadcrumb.style.direction = 'rtl';
    breadcrumb.innerHTML = 'الرئيسية \\ المنتجات \\ التفاصيل';
    elements.push({
      element: breadcrumb,
      expectedDirection: 'rtl',
      testName: 'RTL Breadcrumb'
    });

    return elements;
  }

  /**
   * Test RTL layout for table elements
   */
  static createRTLTableTestElement(): RTLTestElement {
    const table = document.createElement('table');
    table.setAttribute('dir', 'rtl');
    table.style.direction = 'rtl';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['الاسم', 'السعر', 'الكمية', 'الإجمالي'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      th.style.textAlign = 'right';
      th.style.padding = '8px';
      th.style.border = '1px solid #ccc';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    const dataRow = document.createElement('tr');
    ['منتج تجريبي', '١٠٠ ريال', '٥', '٥٠٠ ريال'].forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      td.style.textAlign = 'right';
      td.style.padding = '8px';
      td.style.border = '1px solid #ccc';
      dataRow.appendChild(td);
    });
    tbody.appendChild(dataRow);
    table.appendChild(tbody);

    return {
      element: table,
      expectedDirection: 'rtl',
      testName: 'RTL Table'
    };
  }

  /**
   * Validate RTL layout for multiple elements
   */
  static validateMultipleRTLElements(elements: RTLTestElement[]): RTLLayoutValidationResult[] {
    return elements.map(({ element, expectedDirection, testName }) => {
      const result = this.validateRTLLayout(element, expectedDirection);
      return {
        ...result,
        testName,
      } as RTLLayoutValidationResult & { testName: string };
    });
  }

  /**
   * Validate RTL layout (simplified version of the main utility)
   */
  private static validateRTLLayout(element: HTMLElement, expectedDirection: 'ltr' | 'rtl'): RTLLayoutValidationResult {
    const issues: string[] = [];
    
    // Check dir attribute
    const dirAttribute = element.getAttribute('dir') || 
                        element.closest('[dir]')?.getAttribute('dir') || 
                        document.documentElement.getAttribute('dir') || 'ltr';
    
    if (dirAttribute !== expectedDirection) {
      issues.push(`Expected dir="${expectedDirection}" but found dir="${dirAttribute}"`);
    }

    // Check CSS direction
    const computedStyle = window.getComputedStyle(element);
    const cssDirection = computedStyle.direction;
    
    if (cssDirection !== expectedDirection) {
      issues.push(`Expected CSS direction: ${expectedDirection} but found: ${cssDirection}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      element,
      expectedDirection,
      actualDirection: dirAttribute,
    };
  }

  /**
   * Test RTL transitions (switching from LTR to RTL)
   */
  static testRTLTransition(element: HTMLElement): {
    beforeTransition: RTLLayoutValidationResult;
    afterTransition: RTLLayoutValidationResult;
    transitionSuccessful: boolean;
  } {
    // Test initial LTR state
    element.setAttribute('dir', 'ltr');
    element.style.direction = 'ltr';
    element.style.textAlign = 'left';
    
    const beforeTransition = this.validateRTLLayout(element, 'ltr');
    
    // Transition to RTL
    element.setAttribute('dir', 'rtl');
    element.style.direction = 'rtl';
    element.style.textAlign = 'right';
    
    const afterTransition = this.validateRTLLayout(element, 'rtl');
    
    const transitionSuccessful = beforeTransition.isValid && afterTransition.isValid;
    
    return {
      beforeTransition,
      afterTransition,
      transitionSuccessful,
    };
  }

  /**
   * Create performance test for RTL layout changes
   */
  static performRTLPerformanceTest(elementCount: number = 100): {
    transitionTime: number;
    elementsProcessed: number;
    averageTimePerElement: number;
  } {
    const elements: HTMLElement[] = [];
    
    // Create test elements
    for (let i = 0; i < elementCount; i++) {
      const element = this.createArabicTestElement(`النص العربي ${i}`);
      document.body.appendChild(element);
      elements.push(element);
    }
    
    // Measure transition time
    const startTime = performance.now();
    
    elements.forEach(element => {
      element.setAttribute('dir', 'rtl');
      element.style.direction = 'rtl';
      element.style.textAlign = 'right';
    });
    
    // Force layout recalculation
    elements.forEach(element => {
      element.offsetHeight; // Trigger reflow
    });
    
    const endTime = performance.now();
    const transitionTime = endTime - startTime;
    
    // Cleanup
    elements.forEach(element => {
      document.body.removeChild(element);
    });
    
    return {
      transitionTime,
      elementsProcessed: elementCount,
      averageTimePerElement: transitionTime / elementCount,
    };
  }
}

export default RTLTestHelpers;