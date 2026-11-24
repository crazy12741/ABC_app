import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { AppText } from './AppText';

type Tone = 'white' | 'cream' | 'charcoal';

export function StatTile({
  value,
  label,
  tone = 'white',
}: {
  value: string;
  label: string;
  tone?: Tone;
}) {
  const dark = tone === 'charcoal';
  return (
    <View
      style={[
        styles.base,
        tone === 'cream' ? styles.cream : null,
        dark ? styles.charcoal : null,
      ]}
    >
      <AppText
        variant="displaySmall"
        color={dark ? colors.white : colors.charcoal}
        style={styles.value}
        numberOfLines={1}
      >
        {value}
      </AppText>
      <AppText
        variant="caption"
        color={dark ? '#C9BBA9' : colors.muted}
        numberOfLines={2}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: 4,
  },
  cream: {
    backgroundColor: colors.creamDeep,
  },
  charcoal: {
    backgroundColor: colors.charcoal,
    borderColor: colors.charcoal,
  },
  value: {
    fontSize: 26,
    lineHeight: 30,
  },
});
