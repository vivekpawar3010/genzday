/**
 * Analyzes image brightness/luminance and provides optimal text and card theme colors
 * based on the background image.
 */

export interface DynamicThemeColors {
  textMain: string;
  textMuted: string;
  cardBg: string;
  border: string;
  isDarkBackground: boolean;
}

// Fallback lookup for known theme presets when CORS blocks canvas extraction or offline
const PRESET_FALLBACKS: Record<string, DynamicThemeColors> = {
  default: {
    textMain: '#1e293b',
    textMuted: '#475569',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(0, 0, 0, 0.08)',
    isDarkBackground: false,
  },
  'green-leaves': {
    textMain: '#064e3b',
    textMuted: '#065f46',
    cardBg: 'rgba(255, 255, 255, 0.82)',
    border: 'rgba(6, 78, 59, 0.12)',
    isDarkBackground: false,
  },
  'aroma-coffee': {
    textMain: '#451a03',
    textMuted: '#92400e',
    cardBg: 'rgba(252, 250, 242, 0.88)',
    border: 'rgba(69, 26, 3, 0.12)',
    isDarkBackground: false,
  },
  honeycomb: {
    textMain: '#78350f',
    textMuted: '#b45309',
    cardBg: 'rgba(255, 252, 235, 0.88)',
    border: 'rgba(120, 53, 15, 0.12)',
    isDarkBackground: false,
  },
  'blue-winter': {
    textMain: '#0c4a6e',
    textMuted: '#0369a1',
    cardBg: 'rgba(240, 249, 255, 0.86)',
    border: 'rgba(12, 74, 110, 0.12)',
    isDarkBackground: false,
  },
  'dark-night': {
    textMain: '#f8fafc',
    textMuted: '#94a3b8',
    cardBg: 'rgba(15, 23, 42, 0.80)',
    border: 'rgba(255, 255, 255, 0.14)',
    isDarkBackground: true,
  },
  'midnight-lavender': {
    textMain: '#fdf4ff',
    textMuted: '#e879f9',
    cardBg: 'rgba(46, 16, 77, 0.75)',
    border: 'rgba(255, 255, 255, 0.16)',
    isDarkBackground: true,
  },
  'sahara-sunset': {
    textMain: '#4c0519',
    textMuted: '#9f1239',
    cardBg: 'rgba(255, 241, 242, 0.85)',
    border: 'rgba(159, 18, 57, 0.14)',
    isDarkBackground: false,
  },
  '3d-green': {
    textMain: '#ecfdf5',
    textMuted: '#a7f3d0',
    cardBg: 'rgba(6, 78, 59, 0.45)',
    border: 'rgba(255, 255, 255, 0.20)',
    isDarkBackground: true,
  },
};

/**
 * Calculates perceived luminance using standard ITU-R BT.709 formulas
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Extracts average color and computes dynamic contrast colors from an image URL
 */
export function extractColorsFromImage(
  imageUrl: string,
  presetId?: string
): Promise<DynamicThemeColors> {
  return new Promise((resolve) => {
    if (!imageUrl || imageUrl === '3d') {
      resolve(PRESET_FALLBACKS['3d-green']);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const fallback = (presetId && PRESET_FALLBACKS[presetId]) || PRESET_FALLBACKS.default;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(fallback);
          return;
        }

        // Downsample to 40x40 for fast, lightweight performance
        const sampleSize = 40;
        canvas.width = sampleSize;
        canvas.height = sampleSize;

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let count = 0;

        for (let i = 0; i < imageData.length; i += 4) {
          const alpha = imageData[i + 3];
          if (alpha > 128) {
            totalR += imageData[i];
            totalG += imageData[i + 1];
            totalB += imageData[i + 2];
            count++;
          }
        }

        if (count === 0) {
          resolve(fallback);
          return;
        }

        const avgR = Math.round(totalR / count);
        const avgG = Math.round(totalG / count);
        const avgB = Math.round(totalB / count);

        const luminance = getRelativeLuminance(avgR, avgG, avgB);
        const isDark = luminance < 130;

        if (isDark) {
          // Dark background -> Crisp light text & dark translucent card
          resolve({
            textMain: '#f8fafc',
            textMuted: '#cbd5e1',
            cardBg: `rgba(${Math.max(10, avgR - 20)}, ${Math.max(12, avgG - 20)}, ${Math.max(16, avgB - 20)}, 0.80)`,
            border: 'rgba(255, 255, 255, 0.16)',
            isDarkBackground: true,
          });
        } else {
          // Light background -> High-contrast slate/charcoal text & bright translucent card
          resolve({
            textMain: '#0f172a',
            textMuted: '#475569',
            cardBg: 'rgba(255, 255, 255, 0.84)',
            border: 'rgba(0, 0, 0, 0.08)',
            isDarkBackground: false,
          });
        }
      } catch (err) {
        // In case of canvas taint / CORS security error
        console.warn('CORS restricted image, using fallback theme colors:', err);
        resolve(fallback);
      }
    };

    img.onerror = () => {
      resolve(fallback);
    };

    img.src = imageUrl;
  });
}

/**
 * Applies dynamic colors directly to CSS root custom properties
 */
export function applyDynamicThemeColors(colors: DynamicThemeColors) {
  const root = document.documentElement;
  root.style.setProperty('--text-main', colors.textMain);
  root.style.setProperty('--text-muted', colors.textMuted);
  root.style.setProperty('--card-bg', colors.cardBg);
  root.style.setProperty('--border', colors.border);
  if (colors.isDarkBackground) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
