import { Platform, useColorScheme } from 'react-native';

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

type Palette = {
  background: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  onAccent: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
};

const palettes: Record<'light' | 'dark', Palette> = {
  light: {
    background: '#FBFBFA',
    surface: '#FFFFFF',
    surfaceSubtle: '#F3F4F1',
    border: '#E6E7E2',
    borderStrong: '#D6D8D1',
    textPrimary: '#181A17',
    textSecondary: '#666B62',
    textTertiary: '#9AA096',
    accent: '#1E8E5A',
    accentStrong: '#146B44',
    accentSoft: '#E6F6ED',
    onAccent: '#FFFFFF',
    danger: '#DC2626',
    dangerSoft: '#FDECEC',
    overlay: 'rgba(10, 12, 9, 0.55)',
  },
  dark: {
    background: '#0B0C0A',
    surface: '#161815',
    surfaceSubtle: '#1E211D',
    border: '#2A2D27',
    borderStrong: '#383C34',
    textPrimary: '#F5F6F2',
    textSecondary: '#A7ADA1',
    textTertiary: '#767C71',
    accent: '#3BCB80',
    accentStrong: '#2FAE6D',
    accentSoft: 'rgba(59, 203, 128, 0.14)',
    onAccent: '#04120A',
    danger: '#F87171',
    dangerSoft: 'rgba(248, 113, 113, 0.12)',
    overlay: 'rgba(0, 0, 0, 0.65)',
  },
} as const;

export type Scheme = 'light' | 'dark';

export type Theme = Palette & {
  spacing: typeof spacing;
  radius: typeof radius;
  scheme: Scheme;
};

export function useTheme(): Theme {
  const scheme: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { ...palettes[scheme], spacing, radius, scheme };
}

export function shadow(theme: Theme, elevation: 'sm' | 'md' = 'sm') {
  const offsetY = elevation === 'sm' ? 2 : 6;
  const blurRadius = elevation === 'sm' ? 8 : 16;
  const color = theme.scheme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(26, 28, 24, 0.08)';

  if (Platform.OS === 'web') {
    return {
      boxShadow: `0px ${offsetY}px ${blurRadius}px ${color}`,
    } as const;
  }

  return {
    shadowColor: theme.scheme === 'dark' ? '#000000' : '#1A1C18',
    shadowOpacity: theme.scheme === 'dark' ? 0.5 : 0.08,
    shadowRadius: blurRadius,
    shadowOffset: { width: 0, height: offsetY },
    elevation: elevation === 'sm' ? 2 : 6,
  } as const;
}
