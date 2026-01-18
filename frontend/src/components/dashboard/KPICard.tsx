import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  period?: string;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  icon: Icon,
  change,
  trend,
  period,
  className,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      case 'neutral':
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-500';
    }
  };

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-lg shadow-subtle p-5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
          </div>
          
          <div className="mt-3">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            
            {(change || period) && (
              <div className="flex items-center gap-2 mt-2">
                {change && trend && (
                  <div className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}>
                    {getTrendIcon()}
                    <span>{change}</span>
                  </div>
                )}
                {period && (
                  <span className="text-xs text-gray-500">{period}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
