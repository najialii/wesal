import React from 'react';
import { Globe, Users, Tag } from 'lucide-react';
import { useTranslation } from '../../lib/translation';

interface SharedBadgeProps {
  type: 'category' | 'customer' | 'general';
  size?: 'sm' | 'md';
  showTooltip?: boolean;
  className?: string;
}

const SharedBadge: React.FC<SharedBadgeProps> = ({
  type,
  size = 'sm',
  showTooltip = true,
  className = '',
}) => {
  const { t } = useTranslation('common');

  const getIcon = () => {
    switch (type) {
      case 'category':
        return <Tag className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
      case 'customer':
        return <Users className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
      default:
        return <Globe className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
    }
  };

  const getTooltipText = () => {
    switch (type) {
      case 'category':
        return t('sharedCategoryTooltip', { fallback: 'Categories are shared across all branches. Changes affect all locations.' });
      case 'customer':
        return t('sharedCustomerTooltip', { fallback: 'Customers are shared across all branches. They can be served at any location.' });
      default:
        return t('sharedTooltip', { fallback: 'This item is shared across all branches.' });
    }
  };

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1' 
    : 'px-2.5 py-1 text-sm gap-1.5';

  return (
    <span
      className={`inline-flex items-center ${sizeClasses} bg-blue-50 text-blue-700 rounded-full font-medium ${className}`}
      title={showTooltip ? getTooltipText() : undefined}
    >
      {getIcon()}
      <span>{t('shared', { fallback: 'Shared' })}</span>
    </span>
  );
};

export default SharedBadge;
