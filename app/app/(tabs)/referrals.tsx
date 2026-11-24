import { Platform, Pressable, Share, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import {
  CheckCircle2,
  Clock,
  Copy,
  Gift,
  Share2,
  Users,
} from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { useSignedIn } from '@/hooks/useSignedIn';
import { apiGet } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { ReferralSummary } from '@/lib/types';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Screen } from '@/components/Screen';
import { ScreenSkeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { useToast } from '@/components/ToastProvider';

function rewardTone(status: string): 'green' | 'orange' | 'muted' {
  if (status === 'rewarded') return 'green';
  if (status === 'pending') return 'orange';
  return 'muted';
}

function rewardLabel(status: string): string {
  if (status === 'rewarded') return 'Rewarded';
  if (status === 'pending') return 'Pending';
  return 'Not eligible';
}

export default function ReferralsScreen() {
  const { showToast } = useToast();
  const signedIn = useSignedIn();
  const query = useQuery({
    queryKey: ['referrals'],
    queryFn: ({ signal }) => apiGet<ReferralSummary>('/api/referrals', signal),
    enabled: signedIn,
  });

  const data = query.data;

  const copyCode = async () => {
    if (!data?.code) return;
    await Clipboard.setStringAsync(data.code);
    showToast('Referral code copied.', 'success');
  };

  const share = async () => {
    if (!data?.code) return;
    const message = `I'm joining American Burger Club in Kochi. Use my referral code ${data.code} when you verify your number. Five tastes. One experience.`;
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(message);
      showToast('Invite copied. Share it with your crew.', 'success');
      return;
    }
    try {
      await Share.share({ message });
    } catch {
      // Dismissed by the customer.
    }
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
          title="Referrals are unavailable"
          message="We could not load your referral details. Pull to refresh or try again."
          onRetry={() => query.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      contentContainerStyle={styles.content}
    >
      <View style={styles.heading}>
        <AppText variant="caption" color={colors.orangeDark}>
          Referral programme
        </AppText>
        <AppText variant="h1">Bring your crew</AppText>
        <AppText variant="body" color={colors.muted}>
          Share your personal code. When a friend verifies their number with it,
          the referral is linked to your account.
        </AppText>
      </View>

      <Card tone="charcoal" style={styles.codeCard}>
        <View style={styles.codeTop}>
          <View style={styles.flex}>
            <AppText variant="caption" color="#C9BBA9">
              Your referral code
            </AppText>
            <AppText variant="mono" color={colors.white} style={styles.code}>
              {data.code ?? 'Pending'}
            </AppText>
          </View>
          <View style={styles.giftCircle}>
            <Gift size={22} strokeWidth={2.1} color={colors.orange} />
          </View>
        </View>

        <View style={styles.codeActions}>
          <Pressable
            onPress={copyCode}
            disabled={!data.code}
            accessibilityRole="button"
            accessibilityLabel="Copy referral code"
            style={({ pressed }) => [
              styles.codeAction,
              pressed && styles.pressed,
            ]}
          >
            <Copy size={17} strokeWidth={2.2} color={colors.white} />
            <AppText variant="smallStrong" color={colors.white}>
              Copy code
            </AppText>
          </Pressable>
          <View style={styles.actionDivider} />
          <Pressable
            onPress={share}
            disabled={!data.code}
            accessibilityRole="button"
            accessibilityLabel="Share referral invite"
            style={({ pressed }) => [
              styles.codeAction,
              pressed && styles.pressed,
            ]}
          >
            <Share2 size={17} strokeWidth={2.2} color={colors.white} />
            <AppText variant="smallStrong" color={colors.white}>
              Share invite
            </AppText>
          </Pressable>
        </View>
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <View style={styles.statIcon}>
            <Users size={18} strokeWidth={2.1} color={colors.orangeDark} />
          </View>
          <AppText variant="displaySmall" style={styles.statValue}>
            {data.verifiedCount}
          </AppText>
          <AppText variant="caption" color={colors.muted}>
            Verified friends
          </AppText>
        </Card>
        <Card style={styles.statCard}>
          <View style={styles.statIcon}>
            <Clock size={18} strokeWidth={2.1} color={colors.orangeDark} />
          </View>
          <AppText variant="displaySmall" style={styles.statValue}>
            {data.pendingRewardCount}
          </AppText>
          <AppText variant="caption" color={colors.muted}>
            Rewards pending
          </AppText>
        </Card>
      </View>

      <Card tone="orange" style={styles.rewardCard}>
        <View style={styles.rewardTop}>
          <CheckCircle2 size={20} strokeWidth={2.2} color={colors.charcoal} />
          <AppText variant="caption" color={colors.charcoalSoft}>
            How you earn
          </AppText>
        </View>
        <AppText variant="h3">{data.reward ?? 'Club rewards, shared with your crew.'}</AppText>
        <AppText variant="small" color={colors.charcoalSoft}>
          {data.rules ??
            'Referrals are reviewed by the club. Rewards are marked manually after each verified friend joins.'}
        </AppText>
      </Card>

      <View>
        <SectionHeader title="Referral history" />
        {data.history.length === 0 ? (
          <Card>
            <EmptyState
              icon={Users}
              title="No referrals yet"
              body="Share your code with a friend who is ready to join. Their name will appear here once they verify their number."
              actionLabel="Share invite"
              onAction={share}
            />
          </Card>
        ) : (
          <View style={styles.stack}>
            {data.history.map((item) => (
              <Card key={item.id} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <View style={styles.avatar}>
                    <AppText variant="smallStrong" color={colors.orangeDark}>
                      {item.name.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{item.name}</AppText>
                    <AppText variant="small" color={colors.muted}>
                      Joined {formatDate(item.joinedAt)}
                    </AppText>
                  </View>
                  <Badge label={item.status} tone="green" />
                </View>
                <View style={styles.historyFoot}>
                  <AppText variant="small" color={colors.muted}>
                    Reward status
                  </AppText>
                  <Badge
                    label={rewardLabel(item.rewardStatus)}
                    tone={rewardTone(item.rewardStatus)}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>

      <Card tone="cream" style={styles.rulesCard}>
        <AppText variant="smallStrong">Fair play</AppText>
        <AppText variant="small" color={colors.muted}>
          You cannot refer yourself, and each friend can only be linked to one
          referral. Rewards are never duplicated. The club reviews every
          referral before marking a reward as paid.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  heading: {
    gap: spacing.xs,
  },
  codeCard: {
    gap: spacing.lg,
  },
  codeTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  code: {
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 2.4,
    marginTop: 2,
  },
  giftCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(244,123,32,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(244,123,32,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  codeAction: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  pressed: {
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    gap: 4,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 30,
    lineHeight: 34,
  },
  rewardCard: {
    gap: spacing.sm,
  },
  rewardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  stack: {
    gap: spacing.md,
  },
  historyCard: {
    gap: spacing.md,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  rulesCard: {
    gap: spacing.xs,
  },
});
