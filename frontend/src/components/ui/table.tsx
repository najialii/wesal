import React from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationProvider';

// Table components with RTL/LTR support

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => {
    const { isRTL } = useTranslation();
    
    return (
      <div className="w-full overflow-auto">
        <table
          ref={ref}
          className={cn('w-full caption-bottom text-sm', className)}
          dir={isRTL ? 'rtl' : 'ltr'}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);
Table.displayName = 'Table';

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn('border-b border-gray-200', className)}
        {...props}
      >
        {children}
      </thead>
    );
  }
);
TableHeader.displayName = 'TableHeader';

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tbody ref={ref} className={cn('', className)} {...props}>
        {children}
      </tbody>
    );
  }
);
TableBody.displayName = 'TableBody';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          'border-b border-gray-100 transition-colors hover:bg-gray-50',
          className
        )}
        {...props}
      >
        {children}
      </tr>
    );
  }
);
TableRow.displayName = 'TableRow';

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, ...props }, ref) => {
    const { isRTL } = useTranslation();
    
    return (
      <th
        ref={ref}
        className={cn(
          'h-12 px-4 align-middle font-semibold text-gray-700 text-sm',
          isRTL ? 'text-right' : 'text-left',
          '[&:has([role=checkbox])]:pr-0',
          className
        )}
        {...props}
      >
        {children}
      </th>
    );
  }
);
TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, children, ...props }, ref) => {
    const { isRTL } = useTranslation();
    
    return (
      <td
        ref={ref}
        className={cn(
          'p-4 align-middle text-gray-700',
          isRTL ? 'text-right' : 'text-left',
          '[&:has([role=checkbox])]:pr-0',
          className
        )}
        {...props}
      >
        {children}
      </td>
    );
  }
);
TableCell.displayName = 'TableCell';

export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
  children: React.ReactNode;
}

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <caption
        ref={ref}
        className={cn('mt-4 text-sm text-gray-500', className)}
        {...props}
      >
        {children}
      </caption>
    );
  }
);
TableCaption.displayName = 'TableCaption';

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tfoot
        ref={ref}
        className={cn('border-t border-gray-200 bg-gray-50/50 font-medium', className)}
        {...props}
      >
        {children}
      </tfoot>
    );
  }
);
TableFooter.displayName = 'TableFooter';
