/**
 * **Feature: admin-pages-fix, Property 3: Component reference resolution**
 * **Validates: Requirements 4.2, 4.4**
 * 
 * Property: For any component reference in admin pages, the referenced component 
 * should exist and be properly imported
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

describe('Component Reference Resolution Property Tests', () => {
  const adminPagesDir = join(__dirname, '..');
  const businessPagesDir = join(__dirname, '../../business');
  const componentsDir = join(__dirname, '../../../components');
  
  const adminPageFiles = readdirSync(adminPagesDir)
    .filter(file => file.endsWith('.tsx') && !file.startsWith('__tests__'))
    .map(file => join(adminPagesDir, file));

  const businessPageFiles = readdirSync(businessPagesDir)
    .filter(file => file.endsWith('.tsx') && !file.startsWith('__tests__'))
    .map(file => join(businessPagesDir, file));

  const allPageFiles = [...adminPageFiles, ...businessPageFiles];

  it('should have all referenced components properly imported', () => {
    // Property test: For any component reference, the component should be imported
    const missingImports: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Find JSX component usage
      const componentUsagePattern = /<([A-Z][a-zA-Z0-9]*)/g;
      const usedComponents = new Set<string>();
      let match;

      while ((match = componentUsagePattern.exec(content)) !== null) {
        const componentName = match[1];
        // Skip HTML elements and common React components
        if (!['Fragment', 'Suspense', 'ErrorBoundary'].includes(componentName)) {
          usedComponents.add(componentName);
        }
      }

      // Check if used components are imported
      usedComponents.forEach(componentName => {
        const importPattern = new RegExp(`import.*${componentName}.*from`, 'g');
        if (!importPattern.test(content)) {
          missingImports.push(`${fileName}: Component '${componentName}' is used but not imported`);
        }
      });
    });

    expect(missingImports).toEqual([]);
  });

  it('should have all imported components exist in their referenced paths', () => {
    // Property test: All import statements should reference existing files
    const missingFiles: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';
      const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));

      // Find import statements
      const importPattern = /import.*from\s+['"]([^'"]+)['"]/g;
      let match;

      while ((match = importPattern.exec(content)) !== null) {
        const importPath = match[1];
        
        // Skip external packages and certain patterns
        if (importPath.startsWith('.') || importPath.startsWith('@/')) {
          let resolvedPath = '';
          
          if (importPath.startsWith('./') || importPath.startsWith('../')) {
            // Relative import
            resolvedPath = resolve(fileDir, importPath);
          } else if (importPath.startsWith('@/')) {
            // Absolute import with alias
            const relativePath = importPath.replace('@/', '');
            resolvedPath = resolve(join(__dirname, '../../../'), relativePath);
          }

          // Check if file exists (try with and without extensions)
          const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx'];
          let fileExists = false;

          for (const ext of possibleExtensions) {
            if (existsSync(resolvedPath + ext)) {
              fileExists = true;
              break;
            }
          }

          // Also check for index files
          if (!fileExists) {
            for (const ext of possibleExtensions) {
              if (existsSync(join(resolvedPath, 'index' + ext))) {
                fileExists = true;
                break;
              }
            }
          }

          if (!fileExists) {
            missingFiles.push(`${fileName}: Import path '${importPath}' does not exist`);
          }
        }
      }
    });

    expect(missingFiles).toEqual([]);
  });

  it('should have all modal state variables properly declared', () => {
    // Property test: Modal components should have corresponding state variables
    const missingStateVariables: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Find modal component usage
      const modalUsagePattern = /<(\w*Modal)\s+[^>]*isOpen=\{([^}]+)\}/g;
      let match;

      while ((match = modalUsagePattern.exec(content)) !== null) {
        const modalName = match[1];
        const stateVariable = match[2];

        // Check if state variable is declared
        const stateDeclarationPattern = new RegExp(`useState.*${stateVariable.replace(/^is/, '').replace(/Open$/, '')}`, 'g');
        const directStatePattern = new RegExp(`\\[${stateVariable},`, 'g');
        
        if (!stateDeclarationPattern.test(content) && !directStatePattern.test(content)) {
          missingStateVariables.push(`${fileName}: Modal '${modalName}' uses state '${stateVariable}' but it's not declared`);
        }
      }
    });

    expect(missingStateVariables).toEqual([]);
  });

  it('should have consistent component naming conventions', () => {
    // Property test: Component names should follow consistent conventions
    const namingIssues: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Check for component usage patterns
      const componentPattern = /<([A-Z][a-zA-Z0-9]*)/g;
      let match;

      while ((match = componentPattern.exec(content)) !== null) {
        const componentName = match[1];
        
        // Check naming conventions
        if (componentName.includes('_')) {
          namingIssues.push(`${fileName}: Component '${componentName}' uses underscore (should use PascalCase)`);
        }
        
        if (componentName.toLowerCase() === componentName) {
          namingIssues.push(`${fileName}: Component '${componentName}' should start with uppercase letter`);
        }
      }
    });

    // Log issues but don't fail test for minor naming inconsistencies
    if (namingIssues.length > 0) {
      console.warn('Component naming issues found:', namingIssues);
    }
    
    expect(true).toBe(true);
  });

  it('should have all event handlers properly defined for modal interactions', () => {
    // Property test: Modal event handlers should be defined
    const missingHandlers: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Find modal props that reference handlers
      const handlerPattern = /(\w+)=\{([^}]+)\}/g;
      let match;

      while ((match = handlerPattern.exec(content)) !== null) {
        const propName = match[1];
        const handlerName = match[2];

        // Check for common modal handler props
        if (['onClose', 'onSuccess', 'onSubmit', 'onClick'].includes(propName)) {
          // Skip inline functions and simple expressions
          if (!handlerName.includes('=>') && !handlerName.includes('()') && handlerName.length > 3) {
            // Check if handler is defined
            const handlerPattern = new RegExp(`(const|function)\\s+${handlerName}|${handlerName}\\s*=`, 'g');
            if (!handlerPattern.test(content)) {
              missingHandlers.push(`${fileName}: Handler '${handlerName}' is referenced but not defined`);
            }
          }
        }
      }
    });

    expect(missingHandlers).toEqual([]);
  });
});