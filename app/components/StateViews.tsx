import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Flame, UtensilsCrossed, WifiOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '@/constants/theme';
import type { LucideIcon } from 'lucide-react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { LogoMark } from './Logo';

export function AuthLoadingScreen({ message = 'Warming up the grill…' }: { message?: string }) {
  return (
    <View style={styles.brand}>
      <StatusBar style="light" />
      <LogoMark size={76} />
      <AppText variant="display" color={colors.white} style={styles.brandTitle}>
        FIVE TASTES.{'\n'}ONE EXPERIENCE.
      </AppText>
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={colors.orange} />
        <AppText variant="small" color="#C9BBA9">
          {message}
        </AppText>
      </View>
    </View>
  );
}

export function ScreenLoading({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={styles.inlineLoading}>
      <ActivityIndicator size="small" color={colors.orange} />
      <AppText variant="small" color={colors.muted}>
        {message}
      </AppText>
    </View>
  );
}

export function ErrorState({
  title = 'Something went off the grill',
  message = 'Check your connection and try again.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.iconWrap}>
        <WifiOff size={22} strokeWidth={2} color={colors.danger} />
      </View>
      <AppText variant="h3" style={styles.centerText}>
        {title}
      </AppText>
      <AppText variant="small" color={colors.muted} style={styles.centerText}>
        {message}
      </AppText>
      {onRetry ? (
        <Button
          label="Try again"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onPress={onRetry}
          style={styles.stateButton}
        />
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon: Icon = UtensilsCrossed,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon?: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.iconWrap}>
        <Icon size={22} strokeWidth={2} color={colors.orangeDark} />
      </View>
      <AppText variant="h3" style={styles.centerText}>
        {title}
      </AppText>
      <AppText variant="small" color={colors.muted} style={styles.centerText}>
        {body}
      </AppText>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          variant="primary"
          size="sm"
          fullWidth={false}
          onPress={onAction}
          style={styles.stateButton}
        />
      ) : null}
    </View>
  );
}

export function NotFoundScreen() {
  const router = useRouter();
  return (
    <View style={styles.brand}>
      <StatusBar style="light" />
      <Flame size={44} color={colors.orange} />
      <AppText variant="displaySmall" color={colors.white} style={styles.brandTitle}>
        THIS TABLE IS EMPTY
      </AppText>
      <AppText variant="small" color="#C9BBA9" style={styles.centerText}>
        The page you were looking for isn’t on the menu.
      </AppText>
      <Button
        label="Back to the club"
        variant="primary"
        fullWidth={false}
        icon={ArrowLeft}
        onPress={() => router.replace('/(tabs)')}
        style={styles.stateButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flex: 1,
    backgroundColor: colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  brandTitle: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  inlineLoading: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  state: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 34,
    paddingHorizontal: 20,
    gap: 8,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  centerText: {
    textAlign: 'center',
    maxWidth: 320,
  },
  stateButton: {
    marginTop: 10,
  },
});
