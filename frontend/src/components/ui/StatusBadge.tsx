import React from 'react';
import { cn } from '@/lib/utils';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatusBadgeProps {
  status: StatusType;
  label: string;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-gray-50 text-gray-700 border-gray-200',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border',
        statusStyles[status],
        className
      )}
    >
      {label}
    </span>
  );
};
