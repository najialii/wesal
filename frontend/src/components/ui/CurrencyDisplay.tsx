import React from 'react';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  showDecimals?: boolean;
  compact?: boolean;
  className?: string;
  iconSize?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const SaudiRiyalIcon: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  return (
    <img 
      src="/currancy.svg" 
      alt="Saudi Riyal" 
      className={cn(sizeClasses[size], 'inline-block', className)}
    />
  );
};

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  showDecimals = true,
  compact = false,
  className,
  iconSize = 'md',
  showIcon = true
}) => {
  const formatAmount = (value: number): string => {
    if (compact) {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
    }
    
    const decimals = showDecimals ? 2 : 0;
    return value.toLocaleString('ar-SA', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {showIcon && <SaudiRiyalIcon size={iconSize} />}
      <span>{formatAmount(amount)}</span>
    </span>
  );
};

export { SaudiRiyalIcon };