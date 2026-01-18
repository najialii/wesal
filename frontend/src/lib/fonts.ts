// Font utilities for WesalTech platform
// Tajawal font family management and utilities

export const FONT_WEIGHTS = {
  extralight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

export const FONT_FAMILIES = {
  sans: 'Tajawal, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  mono: 'JetBrains Mono, Tajawal, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
} as const;

/**
 * Font loading utility to ensure fonts are loaded before use
 */
export class FontLoader {
  private static loadedFonts = new Set<string>();

  /**
   * Load a specific font weight
   */
  static async loadFont(weight: keyof typeof FONT_WEIGHTS): Promise<void> {
    const fontKey = `Tajawal-${weight}`;
    
    if (this.loadedFonts.has(fontKey)) {
      return;
    }

    try {
      const fontFace = new FontFace(
        'Tajawal',
        `url('/src/assets/fonts/Tajawal-${this.capitalize(weight)}.ttf')`,
        {
          weight: FONT_WEIGHTS[weight].toString(),
          style: 'normal',
          display: 'swap',
        }
      );

      await fontFace.load();
      document.fonts.add(fontFace);
      this.loadedFonts.add(fontKey);
    } catch (error) {
      console.warn(`Failed to load font weight ${weight}:`, error);
    }
  }

  /**
   * Load all essential font weights
   */
  static async loadEssentialFonts(): Promise<void> {
    const essentialWeights: (keyof typeof FONT_WEIGHTS)[] = ['regular', 'medium', 'bold'];
    
    await Promise.all(
      essentialWeights.map(weight => this.loadFont(weight))
    );
  }

  /**
   * Check if font is loaded
   */
  static isFontLoaded(weight: keyof typeof FONT_WEIGHTS): boolean {
    return this.loadedFonts.has(`Tajawal-${weight}`);
  }

  /**
   * Get font loading status
   */
  static getFontLoadingStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    Object.keys(FONT_WEIGHTS).forEach(weight => {
      status[weight] = this.isFontLoaded(weight as keyof typeof FONT_WEIGHTS);
    });
    
    return status;
  }

  private static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * CSS class utilities for font weights
 */
export const FONT_WEIGHT_CLASSES = {
  extralight: 'font-extralight',
  light: 'font-light',
  regular: 'font-normal',
  medium: 'font-medium',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
  black: 'font-black',
} as const;

/**
 * Utility to get font family CSS value
 */
export function getFontFamily(type: keyof typeof FONT_FAMILIES = 'sans'): string {
  return FONT_FAMILIES[type];
}

/**
 * Utility to get font weight CSS value
 */
export function getFontWeight(weight: keyof typeof FONT_WEIGHTS): number {
  return FONT_WEIGHTS[weight];
}

/**
 * Initialize font loading on app start
 */
export function initializeFonts(): void {
  // Load essential fonts immediately
  FontLoader.loadEssentialFonts().catch(error => {
    console.warn('Failed to load essential fonts:', error);
  });

  // Load additional weights on idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      const additionalWeights: (keyof typeof FONT_WEIGHTS)[] = ['light', 'extrabold'];
      additionalWeights.forEach(weight => {
        FontLoader.loadFont(weight).catch(error => {
          console.warn(`Failed to load additional font weight ${weight}:`, error);
        });
      });
    });
  }
}

export default {
  FONT_WEIGHTS,
  FONT_FAMILIES,
  FONT_WEIGHT_CLASSES,
  FontLoader,
  getFontFamily,
  getFontWeight,
  initializeFonts,
};