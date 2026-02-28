// Theme tokens - visual design system

export interface ThemeTokens {
  id: string;
  name: string;
  colors: {
    // Primary palette
    primary: string;
    primaryHover: string;
    primaryLight: string;
    
    // Secondary palette
    secondary: string;
    secondaryHover: string;
    secondaryLight: string;
    
    // Accent
    accent: string;
    accentHover: string;
    
    // Phonics-specific
    vowel: string; // Red for vowels
    consonant: string;
    digraph: string; // Special highlighting
    blend: string;
    
    // Semantic colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Neutrals
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  };
  
  fonts: {
    heading: string;
    body: string;
    display: string; // For large phonics words
    mono: string;
  };
  
  fontSizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    display: string; // Extra large for phonics
  };
  
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Default theme
export const defaultTheme: ThemeTokens = {
  id: 'default',
  name: 'Default',
  
  colors: {
    primary: '#3B82F6', // Blue
    primaryHover: '#2563EB',
    primaryLight: '#DBEAFE',
    
    secondary: '#8B5CF6', // Purple
    secondaryHover: '#7C3AED',
    secondaryLight: '#EDE9FE',
    
    accent: '#F59E0B', // Amber
    accentHover: '#D97706',
    
    // Phonics colors (consistent with UFLI standards)
    vowel: '#EF4444', // Red for vowels
    consonant: '#1F2937', // Dark gray for consonants
    digraph: '#10B981', // Green for digraphs
    blend: '#6366F1', // Indigo for blends
    
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    error: '#EF4444', // Red
    info: '#3B82F6', // Blue
    
    background: '#F3F4F6', // Light gray
    surface: '#FFFFFF',
    text: '#111827',
    textMuted: '#6B7280',
    border: '#D1D5DB',
  },
  
  fonts: {
    heading: "'Poppins', sans-serif",
    body: "'Inter', sans-serif",
    display: "'Fredoka', sans-serif", // Friendly, rounded font for phonics
    mono: "'Fira Mono', monospace",
  },
  
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    display: '6rem',  // 96px - for large phonics words
  },
  
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
  },
  
  borderRadius: {
    sm: '0.25rem',  // 4px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
};

// Beach theme (calm, soft colors)
export const beachTheme: ThemeTokens = {
  ...defaultTheme,
  id: 'beach-calm-v1',
  name: 'Beach Calm',
  
  colors: {
    ...defaultTheme.colors,
    primary: '#06B6D4', // Cyan
    primaryHover: '#0891B2',
    primaryLight: '#CFFAFE',
    
    secondary: '#F59E0B', // Sandy amber
    secondaryHover: '#D97706',
    secondaryLight: '#FEF3C7',
    
    accent: '#EC4899', // Pink
    accentHover: '#DB2777',
    
    background: '#F0FDFA', // Very light cyan
    surface: '#FFFFFF',
  },
};

// Theme registry
export const themes: Record<string, ThemeTokens> = {
  'default': defaultTheme,
  'beach-calm-v1': beachTheme,
};

// Get theme by ID
export function getTheme(themeId: string): ThemeTokens {
  return themes[themeId] || defaultTheme;
}
