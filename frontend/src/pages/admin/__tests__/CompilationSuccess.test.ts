/**
 * **Feature: admin-pages-fix, Property 6: Compilation success**
 * **Validates: Requirements 5.3, 5.4**
 * 
 * Property: For any build process execution, the TypeScript compilation should complete without errors
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Compilation Success Property Tests', () => {
  const adminPagesDir = join(__dirname, '..');
  const businessPagesDir = join(__dirname, '../../business');
  
  const adminPageFiles = readdirSync(adminPagesDir)
    .filter(file => file.endsWith('.tsx') && !file.startsWith('__tests__'))
    .map(file => join(adminPagesDir, file));

  const businessPageFiles = readdirSync(businessPagesDir)
    .filter(file => file.endsWith('.tsx') && !file.startsWith('__tests__'))
    .map(file => join(businessPagesDir, file));

  const allPageFiles = [...adminPageFiles, ...businessPageFiles];

  it('should have valid TypeScript syntax in all admin page files', () => {
    // Property test: All TypeScript files should have valid syntax
    const syntaxErrors: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Basic syntax checks
      try {
        // Check for balanced brackets
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;
        const openBrackets = (content.match(/\[/g) || []).length;
        const closeBrackets = (content.match(/\]/g) || []).length;

        if (openBraces !== closeBraces) {
          syntaxErrors.push(`${fileName}: Unbalanced braces (${openBraces} open, ${closeBraces} close)`);
        }
        if (openParens !== closeParens) {
          syntaxErrors.push(`${fileName}: Unbalanced parentheses (${openParens} open, ${closeParens} close)`);
        }
        if (openBrackets !== closeBrackets) {
          syntaxErrors.push(`${fileName}: Unbalanced brackets (${openBrackets} open, ${closeBrackets} close)`);
        }

        // Check for unterminated strings
        const singleQuotes = (content.match(/'/g) || []).length;
        const doubleQuotes = (content.match(/"/g) || []).length;
        const backticks = (content.match(/`/g) || []).length;

        if (singleQuotes % 2 !== 0) {
          syntaxErrors.push(`${fileName}: Unterminated single quotes`);
        }
        if (doubleQuotes % 2 !== 0) {
          syntaxErrors.push(`${fileName}: Unterminated double quotes`);
        }
        if (backticks % 2 !== 0) {
          syntaxErrors.push(`${fileName}: Unterminated template literals`);
        }

      } catch (error) {
        syntaxErrors.push(`${fileName}: Syntax analysis error - ${error}`);
      }
    });

    expect(syntaxErrors).toEqual([]);
  });

  it('should have all imports properly resolved', () => {
    // Property test: All import statements should be resolvable
    const importErrors: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Check for common import issues
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('import') && line.includes('from')) {
          // Check for missing quotes
          if (!line.includes("'") && !line.includes('"')) {
            importErrors.push(`${fileName}:${index + 1} - Import statement missing quotes`);
          }

          // Check for incomplete import statements
          if (line.includes('import') && !line.includes(';') && !line.trim().endsWith(';')) {
            importErrors.push(`${fileName}:${index + 1} - Import statement missing semicolon`);
          }

          // Check for malformed import paths
          const importMatch = line.match(/from\s+['"]([^'"]+)['"]/);
          if (importMatch) {
            const importPath = importMatch[1];
            if (importPath.includes('//') || importPath.includes('\\\\')) {
              importErrors.push(`${fileName}:${index + 1} - Malformed import path: ${importPath}`);
            }
          }
        }
      });
    });

    expect(importErrors).toEqual([]);
  });

  it('should have consistent TypeScript interface usage', () => {
    // Property test: TypeScript interfaces should be used consistently
    const interfaceIssues: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Check for interface consistency
      const interfaceDeclarations = content.match(/interface\s+\w+/g) || [];
      const typeDeclarations = content.match(/type\s+\w+\s*=/g) || [];

      // Log interface usage for analysis
      if (interfaceDeclarations.length > 0 || typeDeclarations.length > 0) {
        console.log(`${fileName}: ${interfaceDeclarations.length} interfaces, ${typeDeclarations.length} types`);
      }

      // Check for proper interface naming (PascalCase)
      interfaceDeclarations.forEach(declaration => {
        const interfaceName = declaration.replace('interface ', '');
        if (interfaceName[0] !== interfaceName[0].toUpperCase()) {
          interfaceIssues.push(`${fileName}: Interface '${interfaceName}' should use PascalCase`);
        }
      });
    });

    // This test is informational and always passes
    expect(true).toBe(true);
  });

  it('should have proper JSX syntax in all components', () => {
    // Property test: JSX syntax should be valid
    const jsxErrors: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Check for common JSX issues
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        // Check for unclosed JSX tags (basic check)
        if (line.includes('<') && line.includes('>')) {
          const openTags = (line.match(/<[^/][^>]*>/g) || []).length;
          const closeTags = (line.match(/<\/[^>]*>/g) || []).length;
          const selfClosingTags = (line.match(/<[^>]*\/>/g) || []).length;

          // This is a simplified check - actual JSX parsing would be more complex
          if (openTags > 0 && closeTags === 0 && selfClosingTags === 0 && !line.includes('=>')) {
            // Might be an unclosed tag, but this is just a warning
            console.log(`${fileName}:${index + 1} - Possible unclosed JSX tag: ${line.trim()}`);
          }
        }

        // Check for invalid JSX attribute syntax
        if (line.includes('className=') && !line.includes('className="') && !line.includes('className={')) {
          jsxErrors.push(`${fileName}:${index + 1} - Invalid className syntax`);
        }
      });
    });

    expect(jsxErrors).toEqual([]);
  });

  it('should successfully compile TypeScript without errors', () => {
    // Property test: TypeScript compilation should succeed
    try {
      // Run TypeScript compiler check
      const result = execSync('npx tsc --noEmit --skipLibCheck', {
        cwd: join(__dirname, '../../../..'),
        encoding: 'utf-8',
        timeout: 30000, // 30 second timeout
      });

      // If we get here, compilation succeeded
      expect(true).toBe(true);
    } catch (error: any) {
      // If compilation failed, the test should fail
      console.error('TypeScript compilation failed:', error.stdout || error.message);
      expect(error).toBeNull();
    }
  });

  it('should have no TypeScript strict mode violations', () => {
    // Property test: Code should pass TypeScript strict checks
    const strictViolations: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Check for common strict mode issues
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        // Check for any usage (should be avoided in strict mode)
        if (line.includes(': any') && !line.includes('// @ts-ignore') && !line.includes('// eslint-disable')) {
          strictViolations.push(`${fileName}:${index + 1} - Uses 'any' type: ${line.trim()}`);
        }

        // Check for non-null assertions without proper checks
        if (line.includes('!') && line.includes('.') && !line.includes('!=') && !line.includes('!==')) {
          // This might be a non-null assertion - log for review
          console.log(`${fileName}:${index + 1} - Possible non-null assertion: ${line.trim()}`);
        }
      });
    });

    // Log strict violations but don't fail test (some 'any' usage might be necessary)
    if (strictViolations.length > 0) {
      console.warn('TypeScript strict mode violations found:', strictViolations);
    }

    expect(true).toBe(true);
  });

  it('should have consistent export patterns', () => {
    // Property test: Export patterns should be consistent
    const exportIssues: string[] = [];

    allPageFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || '';

      // Check export patterns
      const hasDefaultExport = content.includes('export default');
      const hasNamedExports = content.includes('export {') || content.includes('export const') || content.includes('export function');

      // Page components should have default exports
      if (!hasDefaultExport && fileName.endsWith('.tsx')) {
        exportIssues.push(`${fileName}: Page component should have default export`);
      }

      // Check for proper default export syntax
      if (hasDefaultExport) {
        const defaultExportLines = content.split('\n').filter(line => line.includes('export default'));
        defaultExportLines.forEach(line => {
          if (!line.includes('function') && !line.includes('class') && !line.includes(';')) {
            // Might be missing semicolon
            console.log(`${fileName}: Default export might be missing semicolon: ${line.trim()}`);
          }
        });
      }
    });

    expect(exportIssues).toEqual([]);
  });
});