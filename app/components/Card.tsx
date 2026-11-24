import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { colors, radius, shadow, spacing } from '@/constants/theme';

type Props = ViewProps & {
  tone?: 'white' | 'cream' | 'orange' | 'charcoal';
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

const tones = {
  white: { backgroundColor: colors.white, borderColor: colors.line },
  cream: { backgroundColor: colors.creamDeep, borderColor: colors.line },
  orange: { backgroundColor: colors.orange, borderColor: colors.orange },
  charcoal: { backgroundColor: colors.charcoal, borderColor: colors.charcoal },
};

export function Card({ tone = 'white', padded = true, style, children, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[
        styles.base,
        tones[tone],
        padded ? styles.padded : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadow.card,
  },
  padded: {
    padding: spacing.lg,
  },
});
