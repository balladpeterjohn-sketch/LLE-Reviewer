/* ── Design tokens ──────────────────────────────────────────────────────── */

export const colors = {
  primary:        '#1B4D3E',
  primaryLight:   '#2D6A4F',
  primaryDark:    '#0F2C22',
  primaryMuted:   'rgba(27,77,62,0.08)',
  accent:         '#C9A227',
  accentMuted:    'rgba(201,162,39,0.12)',

  background:     '#F5F7F5',
  surface:        '#FFFFFF',
  surfaceElevated:'#FFFFFF',
  surfaceSubtle:  '#F0F2F0',

  text:           '#0D1A14',
  textSecondary:  '#52685E',
  textTertiary:   '#8FA599',
  textOnPrimary:  '#FFFFFF',

  border:         '#DDE5E0',
  borderFocus:    '#1B4D3E',

  danger:         '#CC2936',
  dangerMuted:    'rgba(204,41,54,0.08)',
  success:        '#1A7F37',
  successMuted:   'rgba(26,127,55,0.08)',

  shadow:         '#0D1A14',
};

export const dark = {
  primary:        '#3DBB85',
  primaryLight:   '#4ECFA0',
  primaryDark:    '#1B4D3E',
  primaryMuted:   'rgba(61,187,133,0.12)',
  accent:         '#E5BE4A',
  accentMuted:    'rgba(229,190,74,0.12)',

  background:     '#0C1410',
  surface:        '#131D17',
  surfaceElevated:'#1A271F',
  surfaceSubtle:  '#111A15',

  text:           '#E8F2EC',
  textSecondary:  '#7EA890',
  textTertiary:   '#4F7A62',
  textOnPrimary:  '#FFFFFF',

  border:         '#233029',
  borderFocus:    '#3DBB85',

  danger:         '#F0514A',
  dangerMuted:    'rgba(240,81,74,0.12)',
  success:        '#3ACF6E',
  successMuted:   'rgba(58,207,110,0.12)',

  shadow:         '#000000',
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const radius = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  14,
  xl:  20,
  full: 999,
};

export const typography = {
  hero:    { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5 },
  title:   { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2 },
  body:    { fontSize: 15, fontWeight: '400' as const, lineHeight: 23 },
  label:   { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  micro:   { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5 },
};

export const shadow = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
