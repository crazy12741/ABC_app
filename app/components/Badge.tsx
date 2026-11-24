import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/constants/theme';
import { AppText } from './AppText';

type Tone = 'orange' | 'green' | 'charcoal' | 'muted' | 'danger' | 'cream';

const tones: Record<Tone, { background: string; color: string; border: string }> = {
  orange: { background: colors.orangeSoft, color: colors.orangeDark, border: '#F6CDA9' },
  green: { background: colors.successSoft, color: colors.success, border: '#BEE3CF' },
  charcoal: { background: colors.charcoal, color: colors.cream, border: colors.charcoal },
  muted: { background: colors.creamDeep, color: colors.muted, border: colors.line },
  danger: { background: colors.dangerSoft, color: colors.danger, border: '#F1C7C1' },
  cream: { background: colors.cream, color: colors.charcoal, border: colors.line },
};

export function Badge({
  label,
  tone = 'orange',
  style,
}: {
  label: string;
  tone?: Tone;
  style?: object;
}) {
  const palette = tones[tone];
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <AppText style={[styles.label, { color: palette.color }]}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});
