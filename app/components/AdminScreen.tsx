import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors, layout, spacing } from '@/constants/theme';
import { AppText } from './AppText';
import { Screen } from './Screen';

export function AdminHeader({
  title,
  subtitle,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.inner}>
        <Pressable
          onPress={onBack ?? (() => router.back())}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          hitSlop={10}
        >
          <ArrowLeft size={19} strokeWidth={2.3} color={colors.white} />
        </Pressable>
        <View style={styles.copy}>
          <AppText variant="smallStrong" color={colors.white} numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="small" color="#C9BBA9" numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {right ?? <View style={styles.spacer} />}
      </View>
    </SafeAreaView>
  );
}

export function AdminScreen({
  title,
  subtitle,
  right,
  onBack,
  children,
  scroll = true,
  refreshing,
  onRefresh,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <View style={styles.root}>
      <AdminHeader title={title} subtitle={subtitle} right={right} onBack={onBack} />
      <Screen
        scroll={scroll}
        edges={[]}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {children}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  safe: {
    backgroundColor: colors.charcoal,
  },
  inner: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  spacer: {
    width: 38,
  },
});
