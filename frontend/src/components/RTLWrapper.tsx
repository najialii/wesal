import React from 'react';
import { useDirectionClasses } from '../lib/simpleTranslation';

interface RTLWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A wrapper component that automatically applies RTL-aware classes
 */
export const RTLWrapper: React.FC<RTLWrapperProps> = ({ children, className = '' }) => {
  const { isRTL } = useDirectionClasses();
  
  return (
    <div className={`${isRTL ? 'rtl' : 'ltr'} ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {children}
    </div>
  );
};

interface FlexProps {
  children: React.ReactNode;
  className?: string;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  items?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  direction?: 'row' | 'col';
  gap?: string;
}

/**
 * RTL-aware flex container
 */
export const RTLFlex: React.FC<FlexProps> = ({ 
  children, 
  className = '', 
  justify = 'start',
  items = 'center',
  direction = 'row',
  gap = ''
}) => {
  const { isRTL } = useDirectionClasses();
  
  const getJustifyClass = () => {
    if (direction === 'col') return `justify-${justify}`;
    
    switch (justify) {
      case 'start': return isRTL ? 'justify-end' : 'justify-start';
      case 'end': return isRTL ? 'justify-start' : 'justify-end';
      default: return `justify-${justify}`;
    }
  };
  
  const getItemsClass = () => {
    if (direction === 'row') return `items-${items}`;
    
    switch (items) {
      case 'start': return isRTL ? 'items-end' : 'items-start';
      case 'end': return isRTL ? 'items-start' : 'items-end';
      default: return `items-${items}`;
    }
  };
  
  const getDirectionClass = () => {
    if (direction === 'col') return 'flex-col';
    return isRTL ? 'flex-row-reverse' : 'flex-row';
  };
  
  const gapClass = gap ? `gap-${gap}` : '';
  
  return (
    <div className={`flex ${getDirectionClass()} ${getJustifyClass()} ${getItemsClass()} ${gapClass} ${className}`}>
      {children}
    </div>
  );
};

interface SpacingProps {
  children: React.ReactNode;
  className?: string;
  size?: string;
  direction?: 'x' | 'y';
}

/**
 * RTL-aware spacing container
 */
export const RTLSpacing: React.FC<SpacingProps> = ({ 
  children, 
  className = '', 
  size = '4',
  direction = 'x'
}) => {
  const { isRTL } = useDirectionClasses();
  
  const getSpacingClass = () => {
    if (direction === 'y') return `space-y-${size}`;
    return isRTL ? `space-x-reverse space-x-${size}` : `space-x-${size}`;
  };
  
  return (
    <div className={`${getSpacingClass()} ${className}`}>
      {children}
    </div>
  );
};

interface TextProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center' | 'start' | 'end';
}

/**
 * RTL-aware text component
 */
export const RTLText: React.FC<TextProps> = ({ 
  children, 
  className = '', 
  align = 'start'
}) => {
  const { isRTL } = useDirectionClasses();
  
  const getAlignClass = () => {
    switch (align) {
      case 'left': return isRTL ? 'text-right' : 'text-left';
      case 'right': return isRTL ? 'text-left' : 'text-right';
      case 'start': return isRTL ? 'text-right' : 'text-left';
      case 'end': return isRTL ? 'text-left' : 'text-right';
      default: return `text-${align}`;
    }
  };
  
  return (
    <div className={`${getAlignClass()} ${className}`}>
      {children}
    </div>
  );
};

export default RTLWrapper;