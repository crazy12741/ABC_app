import { StyleSheet, View } from 'react-native';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { AppText } from './AppText';

type Tone = 'success' | 'error' | 'info';

const tones: Record<
  Tone,
  { background: string; border: string; color: string; icon: typeof Info }
> = {
  success: {
    background: colors.successSoft,
    border: '#BEE3CF',
    color: colors.success,
    icon: CheckCircle2,
  },
  error: {
    background: colors.dangerSoft,
    border: '#F1C7C1',
    color: colors.danger,
    icon: AlertCircle,
  },
  info: {
    background: '#EAF0FB',
    border: '#C9D8F2',
    color: colors.info,
    icon: Info,
  },
};

export function InlineMessage({
  message,
  tone = 'info',
}: {
  message: string;
  tone?: Tone;
}) {
  const style = tones[tone];
  const Icon = style.icon;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.base,
        { backgroundColor: style.background, borderColor: style.border },
      ]}
    >
      <Icon size={18} strokeWidth={2.2} color={style.color} />
      <AppText variant="small" color={style.color} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  text: {
    flex: 1,
    lineHeight: 19,
  },
});
