import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, fonts } from '@/constants/theme';

type Variant =
  | 'display'
  | 'displaySmall'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'smallStrong'
  | 'caption'
  | 'label'
  | 'button'
  | 'mono';

const variants: Record<Variant, TextStyle> = {
  display: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: 0.3,
    color: colors.charcoal,
  },
  displaySmall: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: 0.3,
    color: colors.charcoal,
  },
  h1: {
    fontFamily: fonts.bold,
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: -0.4,
    color: colors.charcoal,
  },
  h2: {
    fontFamily: fonts.bold,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.3,
    color: colors.charcoal,
  },
  h3: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.2,
    color: colors.charcoal,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.body,
  },
  bodyStrong: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.charcoal,
  },
  small: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  smallStrong: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 19,
    color: colors.charcoal,
  },
  caption: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.charcoal,
  },
  button: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.1,
    color: colors.white,
  },
  mono: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 2,
    color: colors.charcoal,
  },
};

type Props = TextProps & {
  variant?: Variant;
  color?: string;
};

export function AppText({ variant = 'body', color, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[variants[variant], color ? { color } : null, style]}
    />
  );
}
