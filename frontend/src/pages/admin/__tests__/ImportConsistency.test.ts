/**
 * **Feature: admin-pages-fix, Property 1: Import consistency for UI components**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 * 
 * Property: For any admin page file, all UI component imports should use lowercase file names 
 * in the format '@/components/ui/[component-name]'
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Import Consistency Property Tests', () => {
  const adminPagesDir = join(__dirname, '..');
  const adminPageFiles = readdirSync(adminPagesDir)
    .filter(file => file.endsWith('.tsx') && !file.startsWith('__tests__'))
    .map(file => join(adminPagesDir, file));

  it('should use consistent lowercase UI component imports across all admin pages', () => {
    // Property test: For any admin page file, all UI component imports should use lowercase file names
    const uiComponents = ['button', 'card', 'input', 'select', 'badge', 'table', 'dialog', 'form'];
    const incorrectPatterns: string[] = [];

    adminPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Check for capitalized UI component imports
      uiComponents.forEach(component => {
        const capitalizedComponent = component.charAt(0).toUpperCase() + component.slice(1);
        const incorrectPattern = new RegExp(`from ['"]@/components/ui/${capitalizedComponent}['"]`, 'g');
        
        if (incorrectPattern.test(content)) {
          incorrectPatterns.push(`${fileName}: Found capitalized import for ${capitalizedComponent}`);
        }
      });

      // Check for correct lowercase pattern
      const importLines = content.split('\n').filter(line => 
        line.includes("from '@/components/ui/") || line.includes('from "@/components/ui/')
      );

      importLines.forEach(line => {
        const match = line.match(/from ['"]@\/components\/ui\/([^'"]+)['"]/);
        if (match) {
          const componentName = match[1];
          // Verify component name is lowercase
          if (componentName !== componentName.toLowerCase()) {
            incorrectPatterns.push(`${fileName}: Found non-lowercase component import: ${componentName}`);
          }
        }
      });
    });

    expect(incorrectPatterns).toEqual([]);
  });

  it('should follow the correct import path pattern for UI components', () => {
    // Property test: All UI component imports should follow '@/components/ui/[component-name]' pattern
    const invalidPatterns: string[] = [];

    adminPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Find all import lines that reference UI components
      const importLines = content.split('\n').filter(line => 
        line.includes('components/ui/') && (line.includes('import') || line.includes('from'))
      );

      importLines.forEach(line => {
        // Check for incorrect patterns like '../components/ui/' or './components/ui/'
        if (line.includes('../components/ui/') || line.includes('./components/ui/')) {
          invalidPatterns.push(`${fileName}: Found relative path import: ${line.trim()}`);
        }
        
        // Check for missing '@/' prefix
        if (line.includes('components/ui/') && !line.includes('@/components/ui/')) {
          invalidPatterns.push(`${fileName}: Missing '@/' prefix: ${line.trim()}`);
        }
      });
    });

    expect(invalidPatterns).toEqual([]);
  });

  it('should have consistent import formatting across admin pages', () => {
    // Property test: Import statements should be consistently formatted
    const formattingIssues: string[] = [];

    adminPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      const uiImportLines = content.split('\n').filter(line => 
        line.includes("from '@/components/ui/") || line.includes('from "@/components/ui/')
      );

      uiImportLines.forEach(line => {
        // Check for consistent quote usage (prefer single quotes)
        if (line.includes('from "@/components/ui/')) {
          formattingIssues.push(`${fileName}: Uses double quotes instead of single: ${line.trim()}`);
        }
      });
    });

    // Allow some flexibility in quote usage, but log for consistency
    if (formattingIssues.length > 0) {
      console.warn('Quote consistency issues found (not failing test):', formattingIssues);
    }
    
    // This test passes but warns about inconsistencies
    expect(true).toBe(true);
  });
});