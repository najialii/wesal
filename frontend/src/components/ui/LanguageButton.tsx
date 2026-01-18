import React from 'react';
import { LanguageToggle } from '../LanguageToggle';
import { LanguageSelector } from '../LanguageSelector';

interface LanguageButtonProps {
  type?: 'toggle' | 'dropdown' | 'inline';
  variant?: 'button' | 'icon' | 'dropdown' | 'inline';
  size?: 'sm' | 'default' | 'lg';
  showFlags?: boolean;
  className?: string;
}

/**
 * Simple language button component with multiple variants
 * 
 * Usage examples:
 * <LanguageButton /> // Default toggle button
 * <LanguageButton type="dropdown" /> // Full dropdown
 * <LanguageButton type="toggle" variant="icon" /> // Icon only
 */
export const LanguageButton: React.FC<LanguageButtonProps> = ({
  type = 'toggle',
  variant,
  size = 'sm',
  showFlags = true,
  className = '',
}) => {
  // Determine the actual variant based on type and variant props
  const actualVariant = variant || (type === 'toggle' ? 'button' : type);

  if (type === 'toggle') {
    return (
      <LanguageToggle
        variant={actualVariant as 'button' | 'icon'}
        size={size}
        className={className}
      />
    );
  }

  return (
    <LanguageSelector
      variant={actualVariant as 'dropdown' | 'inline'}
      showFlags={showFlags}
      className={className}
    />
  );
};