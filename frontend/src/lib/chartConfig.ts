/**
 * Standardized chart configuration for enterprise-grade visualizations
 * Ensures consistent styling across all charts in the application
 */

export const chartColors = {
  primary: '#088BF8',
  secondary: '#6b7280',
  tertiary: '#9ca3af',
  grid: '#e5e7eb',
  text: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

export const defaultChartConfig = {
  cartesianGrid: {
    strokeDasharray: '3 3',
    stroke: chartColors.grid,
    vertical: false,
    strokeWidth: 1,
  },
  xAxis: {
    tick: { 
      fill: chartColors.text, 
      fontSize: 12,
      fontWeight: 400,
    },
    axisLine: { 
      stroke: chartColors.grid,
      strokeWidth: 1,
    },
    tickLine: false,
    tickMargin: 8,
  },
  yAxis: {
    tick: { 
      fill: chartColors.text, 
      fontSize: 12,
      fontWeight: 400,
    },
    axisLine: false,
    tickLine: false,
    tickMargin: 8,
  },
  tooltip: {
    contentStyle: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
    labelStyle: {
      color: '#374151',
      fontWeight: 600,
      marginBottom: '4px',
    },
    itemStyle: {
      color: '#6b7280',
      fontSize: '14px',
    },
    cursor: {
      stroke: chartColors.grid,
      strokeWidth: 1,
    },
  },
  legend: {
    iconType: 'circle' as const,
    iconSize: 8,
    wrapperStyle: {
      paddingTop: '16px',
      fontSize: '14px',
      color: chartColors.text,
    },
  },
};

/**
 * Get color for data series by index
 * Limits to 3 colors maximum for clarity
 */
export const getSeriesColor = (index: number): string => {
  const colors = [chartColors.primary, chartColors.secondary, chartColors.tertiary];
  return colors[index % colors.length];
};

/**
 * Format large numbers for chart display
 */
export const formatChartNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

/**
 * Get responsive chart dimensions
 */
export const getChartDimensions = (containerWidth: number) => {
  return {
    width: containerWidth,
    height: Math.min(containerWidth * 0.5, 400), // Max height 400px
  };
};
