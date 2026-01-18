import * as React from 'react';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/accessibility';
import { Label } from './label';
import { Input } from './input';
import { Alert, AlertDescription } from './alert';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AccessibleFormFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactElement;
  className?: string;
}

export function AccessibleFormField({
  label,
  error,
  helperText,
  required = false,
  children,
  className,
}: AccessibleFormFieldProps) {
  const fieldId = React.useMemo(() => generateId('field'), []);
  const errorId = React.useMemo(() => generateId('error'), []);
  const helperId = React.useMemo(() => generateId('helper'), []);

  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
  ].filter(Boolean).join(' ');

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={fieldId} className="text-sm font-medium">
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </Label>
      
      <div>
        {React.isValidElement(children) && 
          React.cloneElement(children as React.ReactElement<any>, {
            id: fieldId,
            'aria-invalid': error ? 'true' : 'false',
            'aria-describedby': describedBy || undefined,
            'aria-required': required,
          })
        }
      </div>
      
      {helperText && (
        <p id={helperId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
      
      {error && (
        <Alert variant="destructive" id={errorId} className="py-2">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function AccessibleInput({
  label,
  error,
  helperText,
  required,
  className,
  ...props
}: AccessibleInputProps) {
  return (
    <AccessibleFormField
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      className={className}
    >
      <Input {...props} />
    </AccessibleFormField>
  );
}

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a href={href} className="skip-link">
      {children}
    </a>
  );
}

interface LiveRegionProps {
  children: React.ReactNode;
  level?: 'polite' | 'assertive';
  atomic?: boolean;
  className?: string;
}

export function LiveRegion({
  children,
  level = 'polite',
  atomic = true,
  className,
}: LiveRegionProps) {
  return (
    <div
      className={cn('sr-only', className)}
      aria-live={level}
      aria-atomic={atomic}
    >
      {children}
    </div>
  );
}

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export function FocusTrap({ children, active = true, className }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [active]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}