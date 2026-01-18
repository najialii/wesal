import * as React from 'react';
import { cn } from '@/lib/utils';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'vertical' | 'horizontal';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  children: React.ReactNode;
}

const stackDirections = {
  vertical: 'flex-col',
  horizontal: 'flex-row',
};

const stackSpacing = {
  vertical: {
    none: 'space-y-0',
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },
  horizontal: {
    none: 'space-x-0',
    xs: 'space-x-1',
    sm: 'space-x-2',
    md: 'space-x-4',
    lg: 'space-x-6',
    xl: 'space-x-8',
  },
};

const alignItems = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyContent = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

export function Stack({ 
  direction = 'vertical',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  className, 
  children, 
  ...props 
}: StackProps) {
  return (
    <div
      className={cn(
        'flex',
        stackDirections[direction],
        stackSpacing[direction][spacing],
        alignItems[align],
        justifyContent[justify],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}