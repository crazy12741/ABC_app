import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  ChevronRight,
  Gift,
  LogOut,
  Mail,
  Pencil,
  ShieldCheck,
  ShoppingBag,
  Vote,
} from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';
import { useCart } from '@/lib/cart';
import { useSignedIn } from '@/hooks/useSignedIn';
import { apiGet, apiPatch } from '@/lib/api';
import { formatDate, formatPhone } from '@/lib/format';
import { registerForPush, unregisterPush } from '@/lib/push-client';
import type { ProfileData } from '@/lib/types';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Screen } from '@/components/Screen';
import { ScreenSkeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { useToast } from '@/components/ToastProvider';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function SettingRow({
  icon: Icon,
  title,
  body,
  value,
  onValueChange,
  disabled,
  busy,
}: {
  icon: typeof Bell;
  title: string;
  body: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Icon size={18} strokeWidth={2.1} color={colors.orangeDark} />
      </View>
      <View style={styles.flex}>
        <AppText variant="smallStrong">{title}</AppText>
        <AppText variant="small" color={colors.muted}>
          {body}
        </AppText>
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={colors.orange} />
      ) : (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: colors.lineStrong, true: colors.orange }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.lineStrong}
          accessibilityLabel={title}
        />
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const signedIn = useSignedIn();
  const { clear: clearCart } = useCart();
  const query = useQuery({
    queryKey: ['profile'],
    queryFn: ({ signal }) => apiGet<ProfileData>('/api/profile', signal),
    enabled: signedIn,
  });

  const data = query.data;
  const [pushOverride, setPushOverride] = useState<boolean | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [emailOverride, setEmailOverride] = useState<boolean | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setPushOverride(null);
  }, [data?.profile.pushEnabled]);

  useEffect(() => {
    setEmailOverride(null);
  }, [data?.profile.emailUpdates]);

  const pushOn = pushOverride ?? data?.profile.pushEnabled ?? false;
  const emailOn = emailOverride ?? data?.profile.emailUpdates ?? false;
  const isWeb = Platform.OS === 'web';

  const togglePush = async (next: boolean) => {
    if (pushBusy) return;
    if (isWeb) {
      showToast('Push notifications are available in the iOS and Android app.', 'info');
      return;
    }
    setPushOverride(next);
    setPushBusy(true);
    try {
      const result = next ? await registerForPush() : await unregisterPush();
      if (!result.ok) {
        setPushOverride(!next);
        showToast(result.reason ?? 'Push setting could not be updated.', 'error');
        return;
      }
      showToast(
        next ? 'Push notifications are on.' : 'Push notifications are off.',
        'success',
      );
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } finally {
      setPushBusy(false);
    }
  };

  const toggleEmail = async (next: boolean) => {
    if (emailBusy || !data) return;
    setEmailOverride(next);
    setEmailBusy(true);
    try {
      await apiPatch('/api/profile', { emailUpdates: next });
      showToast(next ? 'Email updates are on.' : 'Email updates are off.', 'success');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      setEmailOverride(!next);
      showToast(
        error instanceof Error ? error.message : 'Email setting could not be updated.',
        'error',
      );
    } finally {
      setEmailBusy(false);
    }
  };

  const doSignOut = async () => {
    setSigningOut(true);
    try {
      if (!isWeb) {
        await unregisterPush().catch(() => undefined);
      }
      await authClient.signOut();
      clearCart();
      queryClient.clear();
      router.replace('/(auth)/welcome');
    } catch {
      setSigningOut(false);
      showToast('We could not sign you out. Try again.', 'error');
    }
  };

  const confirmSignOut = () => {
    if (isWeb) {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm('Sign out of American Burger Club?')
          : true;
      if (confirmed) void doSignOut();
      return;
    }

    Alert.alert(
      'Sign out?',
      'You will need your mobile number and a new SMS code to sign back in.',
      [
        { text: 'Stay signed in', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => void doSignOut() },
      ],
    );
  };

  if (query.isLoading) {
    return (
      <Screen>
        <ScreenSkeleton />
      </Screen>
    );
  }

  if (query.isError || !data) {
    return (
      <Screen>
        <ErrorState
          title="Your profile is not loading"
          message="Check your connection and try again."
          onRetry={() => query.refetch()}
        />
      </Screen>
    );
  }

  const { profile, votingHistory, referral } = data;

  return (
    <Screen
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headingRow}>
        <View style={styles.flex}>
          <AppText variant="caption" color={colors.orangeDark}>
            Your account
          </AppText>
          <AppText variant="h1">Profile</AppText>
        </View>
        <Pressable
          onPress={() => router.push('/profile-edit')}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        >
          <Pencil size={17} strokeWidth={2.2} color={colors.charcoal} />
          <AppText variant="smallStrong">Edit</AppText>
        </Pressable>
      </View>

      <Card tone="charcoal" style={styles.heroCard}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>
              {initials(profile.name) || 'BC'}
            </AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="h2" color={colors.white}>
              {profile.name}
            </AppText>
            <AppText variant="small" color="#C9BBA9">
              {formatPhone(profile.phoneNumber)}
            </AppText>
          </View>
        </View>
        <View style={styles.heroBadges}>
          <Badge
            label={profile.role === 'admin' ? 'Club admin' : 'Verified member'}
            tone={profile.role === 'admin' ? 'orange' : 'green'}
          />
          <AppText variant="small" color="#C9BBA9">
            Member since {formatDate(profile.createdAt)}
          </AppText>
        </View>
      </Card>

      <View>
        <SectionHeader title="Account details" />
        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <AppText variant="small" color={colors.muted}>
              Mobile number
            </AppText>
            <View style={styles.detailValue}>
              <AppText variant="smallStrong">{formatPhone(profile.phoneNumber)}</AppText>
              <Badge label="Verified" tone="green" />
            </View>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <AppText variant="small" color={colors.muted}>
              Email
            </AppText>
            <AppText variant="smallStrong" numberOfLines={1} style={styles.detailValue}>
              {profile.email ?? 'Not added yet'}
            </AppText>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <AppText variant="small" color={colors.muted}>
              Referral code
            </AppText>
            <AppText variant="smallStrong" style={styles.detailValue}>
              {profile.referralCode ?? 'Pending'}
            </AppText>
          </View>
        </Card>
      </View>

      <View>
        <SectionHeader title="Notifications" />
        <Card style={styles.settingsCard}>
          <SettingRow
            icon={Bell}
            title="Push notifications"
            body={
              isWeb
                ? 'Available in the iOS and Android app.'
                : 'Clue drops, announcements and poll alerts.'
            }
            value={pushOn}
            onValueChange={togglePush}
            busy={pushBusy}
            disabled={isWeb}
          />
          <View style={styles.detailDivider} />
          <SettingRow
            icon={Mail}
            title="Email updates"
            body={
              profile.email
                ? 'Occasional club updates by email.'
                : 'Add an email in Edit to receive updates.'
            }
            value={emailOn}
            onValueChange={toggleEmail}
            busy={emailBusy}
            disabled={!profile.email}
          />
        </Card>
      </View>

      <View>
        <SectionHeader title="Your orders" />
        <Card style={styles.referralCard}>
          <View style={styles.referralTop}>
            <View style={styles.settingIcon}>
              <ShoppingBag size={18} strokeWidth={2.1} color={colors.orangeDark} />
            </View>
            <View style={styles.flex}>
              <AppText variant="smallStrong">Food orders</AppText>
              <AppText variant="small" color={colors.muted}>
                Track a live order, check its status or revisit what you loved.
              </AppText>
            </View>
            <ChevronRight size={18} strokeWidth={2.3} color={colors.muted} />
          </View>
          <Button
            label="Open your orders"
            variant="secondary"
            onPress={() => router.push('/orders')}
          />
        </Card>
      </View>

      <View>
        <SectionHeader
          title="Your voting history"
          actionLabel="Vote"
          onAction={() => router.push('/(tabs)/vote')}
        />
        {votingHistory.length === 0 ? (
          <Card>
            <EmptyState
              icon={Vote}
              title="No votes yet"
              body="Once you vote in a member poll, your choice will be listed here."
              actionLabel="Open polls"
              onAction={() => router.push('/(tabs)/vote')}
            />
          </Card>
        ) : (
          <View style={styles.stack}>
            {votingHistory.map((item) => (
              <Card key={item.id} style={styles.voteCard}>
                <AppText variant="smallStrong">{item.question}</AppText>
                <View style={styles.voteFoot}>
                  <Badge label={item.option} tone="orange" />
                  <AppText variant="small" color={colors.muted}>
                    {formatDate(item.votedAt)}
                  </AppText>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>

      <View>
        <SectionHeader title="Referrals" />
        <Card style={styles.referralCard}>
          <View style={styles.referralTop}>
            <View style={styles.settingIcon}>
              <Gift size={18} strokeWidth={2.1} color={colors.orangeDark} />
            </View>
            <View style={styles.flex}>
              <AppText variant="smallStrong">
                {referral.verifiedCount} verified{' '}
                {referral.verifiedCount === 1 ? 'friend' : 'friends'}
              </AppText>
              <AppText variant="small" color={colors.muted}>
                {referral.pendingRewardCount} reward
                {referral.pendingRewardCount === 1 ? '' : 's'} pending · code{' '}
                {referral.code ?? 'pending'}
              </AppText>
            </View>
            <ChevronRight size={18} strokeWidth={2.3} color={colors.muted} />
          </View>
          <Button
            label="Open referral programme"
            variant="secondary"
            onPress={() => router.push('/(tabs)/referrals')}
          />
        </Card>
      </View>

      {profile.role === 'admin' ? (
        <Card tone="cream" style={styles.adminCard}>
          <View style={styles.referralTop}>
            <View style={styles.settingIcon}>
              <ShieldCheck size={18} strokeWidth={2.1} color={colors.orangeDark} />
            </View>
            <View style={styles.flex}>
              <AppText variant="smallStrong">Club dashboard</AppText>
              <AppText variant="small" color={colors.muted}>
                Announcements, clues, polls, referrals and settings.
              </AppText>
            </View>
          </View>
          <Button
            label="Open admin dashboard"
            onPress={() => router.push('/admin')}
          />
        </Card>
      ) : null}

      <Button
        label={signingOut ? 'Signing out…' : 'Sign out'}
        variant="danger"
        icon={LogOut}
        loading={signingOut}
        onPress={confirmSignOut}
      />

      <AppText variant="caption" color={colors.lineStrong} style={styles.footer}>
        Five tastes. One experience.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  editButton: {
    minHeight: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.72,
  },
  heroCard: {
    gap: spacing.md,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Anton_400Regular',
    fontSize: 21,
    color: colors.charcoal,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  detailsCard: {
    gap: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 42,
  },
  detailValue: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    textAlign: 'right',
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.line,
  },
  settingsCard: {
    gap: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    gap: spacing.sm,
  },
  voteCard: {
    gap: spacing.sm,
  },
  voteFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  referralCard: {
    gap: spacing.md,
  },
  referralTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  adminCard: {
    gap: spacing.md,
  },
  footer: {
    textAlign: 'center',
    letterSpacing: 1.4,
    marginTop: spacing.sm,
  },
});
