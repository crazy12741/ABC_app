import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Gift } from 'lucide-react-native';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPatch } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { AdminReferral } from '@/lib/types';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { ScreenSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';

type RewardStatus = 'pending' | 'rewarded' | 'not_eligible';

function rewardTone(status: string): 'green' | 'orange' | 'muted' | 'danger' {
  if (status === 'rewarded') return 'green';
  if (status === 'pending') return 'orange';
  return 'muted';
}

export default function AdminReferralsScreen() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'referrals'],
    queryFn: ({ signal }) =>
      apiGet<{ referrals: AdminReferral[] }>('/api/admin/referrals', signal),
  });

  const referrals = query.data?.referrals ?? [];
  const summary = useMemo(() => {
    const verified = referrals.filter((item) => item.status === 'verified').length;
    const pending = referrals.filter((item) => item.rewardStatus === 'pending').length;
    return { verified, pending };
  }, [referrals]);

  const setReward = async (item: AdminReferral, rewardStatus: RewardStatus) => {
    setBusyId(item.id);
    try {
      await apiPatch(`/api/admin/referrals/${item.id}`, { rewardStatus });
      showToast('Reward status updated.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'referrals'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'The reward status could not be saved.',
        'error',
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminScreen
      title="Referrals"
      subtitle="Review linked customers and mark rewards"
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <View style={styles.content}>
        <View style={styles.summary}>
          <Card style={styles.summaryTile}>
            <AppText variant="displaySmall" style={styles.summaryValue}>
              {summary.verified}
            </AppText>
            <AppText variant="caption" color={colors.muted}>
              Verified referrals
            </AppText>
          </Card>
          <Card style={styles.summaryTile}>
            <AppText variant="displaySmall" style={styles.summaryValue}>
              {summary.pending}
            </AppText>
            <AppText variant="caption" color={colors.muted}>
              Rewards pending
            </AppText>
          </Card>
        </View>

        {query.isLoading ? (
          <ScreenSkeleton blocks={3} />
        ) : query.isError ? (
          <ErrorState
            title="Referrals unavailable"
            message="Check your connection and try again."
            onRetry={() => query.refetch()}
          />
        ) : referrals.length === 0 ? (
          <Card>
            <EmptyState
              icon={Gift}
              title="No referrals yet"
              body="When a customer joins with someone’s code, the link appears here for review."
            />
          </Card>
        ) : (
          <View style={styles.stack}>
            {referrals.map((item) => {
              const busy = busyId === item.id;
              return (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.topRow}>
                    <Badge
                      label={item.status === 'verified' ? 'Verified' : item.status}
                      tone={item.status === 'verified' ? 'green' : 'muted'}
                    />
                    <AppText variant="small" color={colors.muted}>
                      {formatDate(item.createdAt)}
                    </AppText>
                  </View>

                  <View style={styles.people}>
                    <View style={styles.person}>
                      <AppText variant="small" color={colors.muted}>
                        Referrer
                      </AppText>
                      <AppText variant="smallStrong">{item.referrerName}</AppText>
                      <AppText variant="small" color={colors.orangeDark}>
                        {item.referrerCode}
                      </AppText>
                    </View>
                    <View style={styles.arrow}>
                      <Gift size={16} strokeWidth={2.1} color={colors.muted} />
                    </View>
                    <View style={styles.person}>
                      <AppText variant="small" color={colors.muted}>
                        Joined
                      </AppText>
                      <AppText variant="smallStrong">{item.referredName}</AppText>
                    </View>
                  </View>

                  <View style={styles.rewardRow}>
                    <AppText variant="small" color={colors.muted}>
                      Reward
                    </AppText>
                    <Badge
                      label={
                        item.rewardStatus === 'not_eligible'
                          ? 'Not eligible'
                          : item.rewardStatus
                      }
                      tone={rewardTone(item.rewardStatus)}
                    />
                  </View>

                  <View style={styles.actions}>
                    {(
                      [
                        ['pending', 'Pending'],
                        ['rewarded', 'Rewarded'],
                        ['not_eligible', 'Not eligible'],
                      ] as [RewardStatus, string][]
                    ).map(([value, label]) => (
                      <Button
                        key={value}
                        label={label}
                        variant={
                          item.rewardStatus === value
                            ? 'primary'
                            : value === 'not_eligible'
                              ? 'danger'
                              : 'secondary'
                        }
                        size="sm"
                        fullWidth={false}
                        onPress={() => setReward(item, value)}
                        loading={busy && item.rewardStatus !== value}
                        disabled={busy || item.rewardStatus === value}
                      />
                    ))}
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  summary: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryTile: {
    flex: 1,
    gap: 2,
  },
  summaryValue: {
    fontSize: 30,
    lineHeight: 34,
  },
  stack: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  people: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  person: {
    flex: 1,
    gap: 1,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
