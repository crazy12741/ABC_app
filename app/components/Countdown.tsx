import { StyleSheet, View } from 'react-native';
import { useCountdown } from '@/hooks/useCountdown';
import { colors, fonts, radius } from '@/constants/theme';
import { AppText } from './AppText';

type Props = {
  target: string | null;
  variant?: 'dark' | 'light';
  compact?: boolean;
};

export function Countdown({ target, variant = 'dark', compact = false }: Props) {
  const parts = useCountdown(target);

  if (!target) {
    return (
      <View style={styles.empty}>
        <AppText
          variant="smallStrong"
          color={variant === 'dark' ? colors.white : colors.charcoal}
        >
          Opening date to be announced
        </AppText>
        <AppText
          variant="small"
          color={variant === 'dark' ? '#C9BBA9' : colors.muted}
        >
          The club will post the date here first.
        </AppText>
      </View>
    );
  }

  if (parts.expired) {
    return (
      <View style={styles.openRow}>
        <View style={styles.liveDot} />
        <AppText
          variant="h3"
          color={variant === 'dark' ? colors.white : colors.charcoal}
        >
          We are open
        </AppText>
      </View>
    );
  }

  const units: { value: number; label: string }[] = [
    { value: parts.days, label: 'Days' },
    { value: parts.hours, label: 'Hrs' },
    { value: parts.minutes, label: 'Min' },
    { value: parts.seconds, label: 'Sec' },
  ];

  return (
    <View style={styles.row}>
      {units.map((unit, index) => (
        <View key={unit.label} style={styles.unitWrap}>
          <View
            style={[
              styles.unit,
              compact ? styles.unitCompact : null,
              variant === 'dark' ? styles.unitDark : styles.unitLight,
            ]}
          >
            <AppText
              style={[
                styles.value,
                compact ? styles.valueCompact : null,
                { color: variant === 'dark' ? colors.white : colors.charcoal },
              ]}
            >
              {String(unit.value).padStart(2, '0')}
            </AppText>
            <AppText
              style={[
                styles.label,
                { color: variant === 'dark' ? '#C9BBA9' : colors.muted },
              ]}
            >
              {unit.label}
            </AppText>
          </View>
          {index < units.length - 1 ? (
            <AppText
              style={[
                styles.separator,
                { color: variant === 'dark' ? 'rgba(255,255,255,0.35)' : colors.lineStrong },
              ]}
            >
              :
            </AppText>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unit: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    minWidth: 48,
  },
  unitCompact: {
    paddingVertical: 6,
  },
  unitDark: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  unitLight: {
    backgroundColor: colors.cream,
    borderColor: colors.line,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  valueCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  label: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  separator: {
    fontSize: 18,
    paddingHorizontal: 4,
    fontFamily: fonts.semibold,
  },
  empty: {
    gap: 4,
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.orange,
  },
});
