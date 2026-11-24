import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius } from '@/constants/theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'light' | 'ghost' | 'danger';

type Props = {
  label: string;
  loadingLabel?: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'sm';
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityHint?: string;
};

const palette: Record<
  Variant,
  { background: string; border: string; text: string; icon: string }
> = {
  primary: {
    background: colors.orange,
    border: colors.orange,
    text: colors.white,
    icon: colors.white,
  },
  secondary: {
    background: 'transparent',
    border: colors.charcoal,
    text: colors.charcoal,
    icon: colors.charcoal,
  },
  light: {
    background: colors.white,
    border: colors.white,
    text: colors.charcoal,
    icon: colors.charcoal,
  },
  ghost: {
    background: 'transparent',
    border: 'transparent',
    text: colors.orangeDark,
    icon: colors.orangeDark,
  },
  danger: {
    background: colors.dangerSoft,
    border: colors.dangerSoft,
    text: colors.danger,
    icon: colors.danger,
  },
};

export function Button({
  label,
  loadingLabel,
  onPress,
  variant = 'primary',
  icon: Icon,
  loading = false,
  disabled = false,
  size = 'md',
  fullWidth = true,
  style,
  testID,
  accessibilityHint,
}: Props) {
  const tone = palette[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.small,
        {
          backgroundColor: tone.background,
          borderColor: tone.border,
          opacity: isDisabled ? 0.55 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        pressed && !isDisabled ? styles.pressed : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tone.icon} />
      ) : Icon ? (
        <Icon size={18} strokeWidth={2.2} color={tone.icon} />
      ) : null}
      <AppText
        variant="button"
        color={tone.text}
        style={styles.label}
        numberOfLines={1}
      >
        {loading ? loadingLabel ?? label : label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  small: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },
  label: {
    flexShrink: 1,
  },
});
