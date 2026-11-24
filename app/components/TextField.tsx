import { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { AppText } from './AppText';

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string | null;
  icon?: LucideIcon;
  rightSlot?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextInputProps['style'];
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  {
    label,
    hint,
    error,
    icon: Icon,
    rightSlot,
    containerStyle,
    inputStyle,
    multiline,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? colors.danger
    : focused
      ? colors.orange
      : colors.lineStrong;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <AppText variant="label">{label}</AppText>
          {hint ? (
            <AppText variant="small" color={colors.muted}>
              {hint}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.field,
          multiline ? styles.multiline : null,
          { borderColor },
          focused ? styles.focused : null,
          error ? styles.errored : null,
        ]}
      >
        {Icon ? (
          <Icon
            size={19}
            strokeWidth={2}
            color={focused ? colors.orangeDark : colors.muted}
          />
        ) : null}
        <TextInput
          ref={ref}
          {...rest}
          multiline={multiline}
          placeholderTextColor={colors.muted}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            multiline ? styles.inputMultiline : null,
            inputStyle,
          ]}
        />
        {rightSlot}
      </View>

      {error ? (
        <AppText variant="small" color={colors.danger} style={styles.message}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  field: {
    minHeight: 54,
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  multiline: {
    minHeight: 120,
    alignItems: 'flex-start',
    paddingTop: 14,
    paddingBottom: 14,
  },
  focused: {
    backgroundColor: colors.white,
  },
  errored: {
    backgroundColor: '#FFFBF9',
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.charcoal,
    paddingVertical: 12,
    minHeight: 50,
  },
  inputMultiline: {
    minHeight: 92,
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  message: {
    marginTop: -2,
  },
});
