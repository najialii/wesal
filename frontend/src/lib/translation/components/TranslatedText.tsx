/**
 * Component for translated text with immediate updates
 */

import React, { useMemo } from 'react';
import { useTranslation, useBidirectionalText } from '../hooks';
import { InlineTranslationLoading } from './LoadingIndicator';
import type { TranslationOptions } from '../types';

interface TranslatedTextProps extends Omit<TranslationOptions, 'namespace'> {
  tKey: string;
  namespace?: string;
  component?: keyof React.JSX.IntrinsicElements | React.ComponentType<any>;
  className?: string;
  children?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  handleBidi?: boolean;
  [key: string]: any; 
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({
  tKey,
  namespace = 'common',
  component: Component = 'span',
  className = '',
  children,
  loadingComponent,
  errorComponent,
  handleBidi = true,
  fallback,
  interpolation,
  count,
  ...props
}) => {
  const { t, isLoading, error } = useTranslation(namespace);
  const { detectDirection } = useBidirectionalText();

  const translatedText = useMemo(() => {
    return t(tKey, { fallback, interpolation, count });
  }, [t, tKey, fallback, interpolation, count]);

  const textDirection = useMemo(() => {
    if (!handleBidi) return undefined;
    return detectDirection(translatedText);
  }, [handleBidi, detectDirection, translatedText]);

  // Show loading state
  if (isLoading && !translatedText) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return <InlineTranslationLoading fallback={fallback || tKey} />;
  }

  // Show error state
  if (error && !translatedText) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    return React.createElement(
      Component as any,
      { className: `text-red-500 ${className}`, ...props },
      fallback || tKey
    );
  }

  // Render translated text
  const componentProps = {
    className,
    ...(textDirection && textDirection !== 'auto' && {
      dir: textDirection,
      style: { unicodeBidi: 'embed', ...props.style }
    }),
    ...props,
  };

  return React.createElement(
    Component as any,
    componentProps,
    translatedText,
    children
  );
};

interface TranslatedHtmlProps {
  tKey: string;
  namespace?: string;
  className?: string;
  fallback?: string;
  interpolation?: Record<string, string | number>;
  sanitize?: boolean;
}

export const TranslatedHtml: React.FC<TranslatedHtmlProps> = ({
  tKey,
  namespace = 'common',
  className = '',
  fallback,
  interpolation,
  sanitize = true,
}) => {
  const { t } = useTranslation(namespace);

  const translatedHtml = useMemo(() => {
    const text = t(tKey, { fallback, interpolation });
    
    // Basic HTML sanitization if enabled
    if (sanitize) {
      return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    
    return text;
  }, [t, tKey, fallback, interpolation, sanitize]);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: translatedHtml }}
    />
  );
};

interface PluralTextProps {
  tKey: string;
  count: number;
  namespace?: string;
  component?: keyof React.JSX.IntrinsicElements | React.ComponentType<any>;
  className?: string;
  fallback?: string;
  interpolation?: Record<string, string | number>;
  [key: string]: any;
}

export const PluralText: React.FC<PluralTextProps> = ({
  tKey,
  count,
  namespace = 'common',
  component: Component = 'span',
  className = '',
  fallback,
  interpolation,
  ...props
}) => {
  const { t } = useTranslation(namespace);

  const translatedText = useMemo(() => {
    const mergedInterpolation = {
      count,
      ...interpolation,
    };
    return t(tKey, { fallback, interpolation: mergedInterpolation, count });
  }, [t, tKey, count, fallback, interpolation]);

  return React.createElement(
    Component as any,
    { className, ...props },
    translatedText
  );
};

interface InterpolatedTextProps {
  tKey: string;
  values: Record<string, string | number>;
  namespace?: string;
  component?: keyof React.JSX.IntrinsicElements | React.ComponentType<any>;
  className?: string;
  fallback?: string;
  [key: string]: any;
}

export const InterpolatedText: React.FC<InterpolatedTextProps> = ({
  tKey,
  values,
  namespace = 'common',
  component: Component = 'span',
  className = '',
  fallback,
  ...props
}) => {
  const { t } = useTranslation(namespace);

  const translatedText = useMemo(() => {
    return t(tKey, { fallback, interpolation: values });
  }, [t, tKey, fallback, values]);

  return React.createElement(
    Component as any,
    { className, ...props },
    translatedText
  );
};

// Higher-order component for automatic translation
export function withTranslation<P extends object>(
  Component: React.ComponentType<P>,
  namespace?: string
) {
  const WrappedComponent = (props: P) => {
    const translationProps = useTranslation(namespace);
    
    return <Component {...props} {...translationProps} />;
  };

  WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}