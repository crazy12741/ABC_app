import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';
import { AppText } from './AppText';

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? (
          <AppText variant="caption" color={colors.orangeDark}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="h1" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" color={colors.muted}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 18,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  right: {
    paddingTop: 4,
  },
});
