export const colors = {
  primary: '#1B4D3E',
  primaryLight: '#2D6A4F',
  primaryDark: '#0d2219',
  accent: '#C9A227',
  accentLight: '#E8C96A',
  background: '#EEF2EE',
  backgroundDeep: '#E6EDE6',
  surface: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.82)',
  surfaceGlassStrong: 'rgba(255,255,255,0.94)',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textOnPrimary: '#FFFFFF',
  border: '#D8DDD8',
  borderGlass: 'rgba(255,255,255,0.55)',
  borderLight: 'rgba(27,77,62,0.12)',
  danger: '#C0392B',
  success: '#27AE60',
  shadow: '#1B4D3E',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  title:   { fontSize: 24, fontWeight: '700' as const },
  heading: { fontSize: 18, fontWeight: '600' as const },
  body:    { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
};

export const glass = {
  card: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#1B4D3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
  cardStrong: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#1B4D3E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(27,77,62,0.15)',
    shadowColor: '#1B4D3E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
};
