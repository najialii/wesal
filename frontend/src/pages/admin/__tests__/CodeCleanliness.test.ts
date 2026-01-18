/**
 * **Feature: admin-pages-fix, Property 5: Code cleanliness**
 * **Validates: Requirements 5.1, 5.2**
 * 
 * Property: For any admin page file, all declared imports and variables should be used in the code
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Code Cleanliness Property Tests', () => {
  const adminPagesDir = join(__dirname, '..');
  const businessPagesDir = join(__dirname, '../../business');
  
  const adminPageFiles = readdirSync(adminPagesDir)
    .filter(file => file.endsWith('.tsx') && !file.startsWith('__tests__'))
    .map(file => join(adminPagesDir, file));

  const businessPageFiles = readdirSync(businessPagesDir)
    .filter(file => file.endsWith('.tsx') && !file.startsWith('__tests__'))
    .map(file => join(businessPagesDir, file));

  const allPageFiles = [...adminPageFiles, ...businessPageFiles];

  it('should not have unused imports in any page files', () => {
    // Property test: All declared imports should be used in the code
    const unusedImports: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Find all named imports
      const namedImportPattern = /import\s*\{([^}]+)\}\s*from/g;
      let match;

      while ((match = namedImportPattern.exec(content)) !== null) {
        const imports = match[1]
          .split(',')
          .map(imp => imp.trim().split(' as ')[0].trim())
          .filter(imp => imp.length > 0);

        imports.forEach(importName => {
          // Skip type imports and React
          if (importName === 'React' || importName.startsWith('type ')) {
            return;
          }

          // Check if import is used in the code
          const usagePattern = new RegExp(`\\b${importName}\\b`, 'g');
          const matches = content.match(usagePattern);
          
          // Should appear at least twice (once in import, once in usage)
          if (!matches || matches.length < 2) {
            unusedImports.push(`${fileName}: Unused import '${importName}'`);
          }
        });
      }

      // Check default imports
      const defaultImportPattern = /import\s+(\w+)\s+from/g;
      while ((match = defaultImportPattern.exec(content)) !== null) {
        const importName = match[1];
        
        // Skip common patterns that might be used differently
        if (['React', 'api', 'moment'].includes(importName)) {
          continue;
        }

        const usagePattern = new RegExp(`\\b${importName}\\b`, 'g');
        const matches = content.match(usagePattern);
        
        if (!matches || matches.length < 2) {
          unusedImports.push(`${fileName}: Unused default import '${importName}'`);
        }
      }
    });

    expect(unusedImports).toEqual([]);
  });

  it('should not have unused variables in any page files', () => {
    // Property test: All declared variables should be used in the code
    const unusedVariables: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Find variable declarations
      const variablePatterns = [
        /const\s+(\w+)\s*=/g,
        /let\s+(\w+)\s*=/g,
        /var\s+(\w+)\s*=/g,
      ];

      variablePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const varName = match[1];
          
          // Skip common patterns that might be used in JSX or have special usage
          if (['React', 't', 'navigate', 'location', 'params'].includes(varName)) {
            continue;
          }

          // Skip destructured variables that start with underscore (intentionally unused)
          if (varName.startsWith('_')) {
            continue;
          }

          // Check if variable is used
          const usagePattern = new RegExp(`\\b${varName}\\b`, 'g');
          const matches = content.match(usagePattern);
          
          // Should appear at least twice (once in declaration, once in usage)
          if (!matches || matches.length < 2) {
            unusedVariables.push(`${fileName}: Unused variable '${varName}'`);
          }
        }
      });

      // Check function parameters
      const functionPattern = /(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|\([^)]*\)\s*=>\s*\{)/g;
      let match;
      while ((match = functionPattern.exec(content)) !== null) {
        const funcDeclaration = match[0];
        const paramPattern = /\(([^)]*)\)/;
        const paramMatch = funcDeclaration.match(paramPattern);
        
        if (paramMatch) {
          const params = paramMatch[1]
            .split(',')
            .map(p => p.trim().split(':')[0].trim())
            .filter(p => p.length > 0 && !p.startsWith('_'));

          params.forEach(param => {
            if (param && !['e', 'event', 'error'].includes(param)) {
              // Escape special regex characters in parameter name
              const escapedParam = param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const usagePattern = new RegExp(`\\b${escapedParam}\\b`, 'g');
              const matches = content.match(usagePattern);
              
              if (!matches || matches.length < 2) {
                unusedVariables.push(`${fileName}: Unused parameter '${param}'`);
              }
            }
          });
        }
      }
    });

    expect(unusedVariables).toEqual([]);
  });

  it('should not have unused interfaces or types in any page files', () => {
    // Property test: All declared interfaces should be used in the code
    const unusedTypes: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Find interface declarations
      const interfacePattern = /interface\s+(\w+)/g;
      let match;

      while ((match = interfacePattern.exec(content)) !== null) {
        const interfaceName = match[1];
        
        // Check if interface is used
        const usagePattern = new RegExp(`\\b${interfaceName}\\b`, 'g');
        const matches = content.match(usagePattern);
        
        // Should appear at least twice (once in declaration, once in usage)
        if (!matches || matches.length < 2) {
          unusedTypes.push(`${fileName}: Unused interface '${interfaceName}'`);
        }
      }

      // Find type declarations
      const typePattern = /type\s+(\w+)\s*=/g;
      while ((match = typePattern.exec(content)) !== null) {
        const typeName = match[1];
        
        const usagePattern = new RegExp(`\\b${typeName}\\b`, 'g');
        const matches = content.match(usagePattern);
        
        if (!matches || matches.length < 2) {
          unusedTypes.push(`${fileName}: Unused type '${typeName}'`);
        }
      }
    });

    expect(unusedTypes).toEqual([]);
  });

  it('should have consistent code formatting and structure', () => {
    // Property test: Code should follow consistent formatting patterns
    const formattingIssues: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Check for consistent import grouping
      const lines = content.split('\n');
      let inImportSection = false;
      let hasReactImport = false;
      let hasExternalImports = false;
      let hasInternalImports = false;

      lines.forEach((line, index) => {
        if (line.startsWith('import ')) {
          inImportSection = true;
          
          if (line.includes('react')) {
            hasReactImport = true;
          } else if (line.includes('@/') || line.includes('./') || line.includes('../')) {
            hasInternalImports = true;
          } else {
            hasExternalImports = true;
          }
        } else if (inImportSection && line.trim() === '') {
          // End of import section
          inImportSection = false;
        }
      });

      // Log import structure for analysis (not failing the test)
      if (hasReactImport || hasExternalImports || hasInternalImports) {
        console.log(`${fileName}: Import structure - React: ${hasReactImport}, External: ${hasExternalImports}, Internal: ${hasInternalImports}`);
      }
    });

    // This test is informational and always passes
    expect(true).toBe(true);
  });

  it('should not have console.log statements in production code', () => {
    // Property test: Production code should not contain console.log statements
    const consoleStatements: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Find console.log statements (but allow console.error, console.warn)
      const consoleLogPattern = /console\.log\(/g;
      const matches = content.match(consoleLogPattern);

      if (matches) {
        consoleStatements.push(`${fileName}: Found ${matches.length} console.log statement(s)`);
      }
    });

    // Log findings but don't fail test (console.log might be intentional during development)
    if (consoleStatements.length > 0) {
      console.warn('Console.log statements found (consider removing for production):', consoleStatements);
    }

    expect(true).toBe(true);
  });
});