import { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';
import { AppText } from './AppText';

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
};

export function OtpInput({ value, onChange, disabled = false, error = false }: Props) {
  const inputs = useRef<(TextInput | null)[]>([]);

  const focus = (index: number) => {
    if (index >= 0 && index < 6) {
      inputs.current[index]?.focus();
    }
  };

  const handleChange = (text: string, index: number) => {
    const digits = text.replace(/\D/g, '');

    if (digits.length === 0) {
      const next = value.split('');
      next[index] = '';
      onChange(next.join('').replace(/\s/g, ''));
      return;
    }

    if (digits.length > 1) {
      const combined = `${value.slice(0, index)}${digits}`.replace(/\D/g, '').slice(0, 6);
      onChange(combined);
      focus(Math.min(combined.length, 5));
      return;
    }

    const next = value.split('');
    next[index] = digits;
    const combined = next.join('').replace(/\s/g, '').slice(0, 6);
    onChange(combined);
    if (index < 5) focus(index + 1);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {Array.from({ length: 6 }).map((_, index) => {
          const filled = Boolean(value[index]);
          return (
            <Pressable
              key={index}
              onPress={() => focus(index)}
              style={[
                styles.box,
                filled ? styles.filled : null,
                error ? styles.errored : null,
                disabled ? styles.disabled : null,
              ]}
              accessibilityLabel={`Digit ${index + 1} of 6`}
            >
              <TextInput
                ref={(input) => {
                  inputs.current[index] = input;
                }}
                value={value[index] ?? ''}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(event) => {
                  if (
                    event.nativeEvent.key === 'Backspace' &&
                    !value[index] &&
                    index > 0
                  ) {
                    onChange(value.slice(0, index - 1));
                    focus(index - 1);
                  }
                }}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={6}
                editable={!disabled}
                autoFocus={index === 0}
                textContentType={index === 0 ? 'oneTimeCode' : 'none'}
                autoComplete={index === 0 ? 'sms-otp' : 'off'}
                style={styles.input}
                selectionColor={colors.orange}
                caretHidden
              />
            </Pressable>
          );
        })}
      </View>
      <AppText variant="small" color={colors.muted} style={styles.hint}>
        Enter the six-digit code from the SMS.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: 390,
  },
  box: {
    flex: 1,
    height: 60,
    maxWidth: 56,
    minWidth: 40,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    borderColor: colors.orange,
    backgroundColor: '#FFF9F3',
  },
  errored: {
    borderColor: colors.danger,
    backgroundColor: '#FFFBF9',
  },
  disabled: {
    opacity: 0.6,
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 24,
    color: colors.charcoal,
    padding: 0,
  },
  hint: {
    marginTop: 2,
  },
});
