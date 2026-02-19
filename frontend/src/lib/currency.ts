/**
 * Currency formatting utilities for Saudi Riyal
 * Uses the Unicode Saudi Riyal symbol (﷼ U+FDFC)
 */

/**
 * Format a number as Saudi Riyal currency
 * @param amount - The amount to format
 * @param showDecimals - Whether to show decimal places (default: true)
 * @returns Formatted currency string with ﷼ symbol
 */
export const formatCurrency = (amount: number, showDecimals: boolean = true): string => {
  const decimals = showDecimals ? 2 : 0;
  const formatted = amount.toLocaleString('ar-SA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `﷼${formatted}`;
};

/**
 * Format a number as Saudi Riyal currency with compact notation for large numbers
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., ﷼1.2K, ﷼3.5M)
 */
export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1000000) {
    return `﷼${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `﷼${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount, false);
};

/**
 * Parse a currency string back to a number
 * @param currencyString - The currency string to parse
 * @returns The numeric value
 */
export const parseCurrency = (currencyString: string): number => {
  const cleaned = currencyString.replace(/[﷼,\s]/g, '');
  return parseFloat(cleaned) || 0;
};
