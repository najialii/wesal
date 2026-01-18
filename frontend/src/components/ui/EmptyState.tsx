import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      <div className="p-4 bg-gray-50 rounded-full mb-4">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-500 text-center max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
};
