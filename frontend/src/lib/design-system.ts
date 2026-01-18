// Legacy design system - migrated to design-tokens.ts
// This file is kept for backward compatibility during migration

import { BRAND_COLORS, CSS_VARIABLES, BRAND_CLASSES } from './design-tokens';

// Re-export for backward compatibility
export const COLORS = BRAND_COLORS;
export { CSS_VARIABLES, BRAND_CLASSES };

// Deprecated: Use design-tokens.ts for new implementations
console.warn('design-system.ts is deprecated. Use design-tokens.ts for new implementations.');