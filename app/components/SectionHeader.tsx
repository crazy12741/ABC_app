import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { AppText } from './AppText';

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  style,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
}) {
  return (
    <View style={[styles.row, style]}>
      <AppText variant="h2" style={styles.title}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <AppText variant="smallStrong" color={colors.orangeDark}>
            {actionLabel}
          </AppText>
          <ChevronRight size={15} strokeWidth={2.4} color={colors.orangeDark} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    flex: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
    paddingLeft: 8,
  },
  pressed: {
    opacity: 0.65,
  },
});
