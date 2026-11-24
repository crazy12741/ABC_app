export { photo } from './images';

import { Platform } from 'react-native';

export const colors = {
  orange: '#F47B20',
  orangeDark: '#D65F0B',
  orangeSoft: '#FDE3CE',
  charcoal: '#191919',
  charcoalSoft: '#26221F',
  charcoalMuted: '#3A332D',
  cream: '#FFF4E6',
  creamDeep: '#F7E7D2',
  white: '#FFFFFF',
  ink: '#191919',
  body: '#4A4038',
  muted: '#7A6B5D',
  line: '#EADAC6',
  lineStrong: '#DCC7AC',
  success: '#1F7A52',
  successSoft: '#E3F3EA',
  danger: '#B8332A',
  dangerSoft: '#FBE7E4',
  info: '#2C5FB8',
  overlay: 'rgba(18, 14, 11, 0.55)',
  overlayStrong: 'rgba(18, 14, 11, 0.78)',
} as const;

export const fonts = {
  display: 'Anton_400Regular',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const layout = {
  maxWidth: 760,
  gutter: 20,
  tabBarHeight: 74,
  control: 52,
} as const;

export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#3A2818',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
    },
    android: { elevation: 3 },
    default: { boxShadow: '0 8px 24px rgba(58, 40, 24, 0.08)' },
  }),
  floating: Platform.select({
    ios: {
      shadowColor: '#191919',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
    default: { boxShadow: '0 12px 32px rgba(25, 25, 25, 0.16)' },
  }),
} as const;
