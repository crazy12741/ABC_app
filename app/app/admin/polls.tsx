import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Pencil, Plus, Vote } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { apiGet, apiPatch } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { AdminPoll } from '@/lib/types';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { ScreenSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';

export default function AdminPollsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'polls'],
    queryFn: ({ signal }) =>
      apiGet<{ polls: AdminPoll[] }>('/api/admin/polls', signal),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'polls'] });
    queryClient.invalidateQueries({ queryKey: ['polls'] });
    queryClient.invalidateQueries({ queryKey: ['home'] });
  };

  const patch = async (item: AdminPoll, body: Record<string, unknown>, message: string) => {
    setBusyId(item.id);
    try {
      await apiPatch(`/api/admin/polls/${item.id}`, body);
      showToast(message, 'success');
      refresh();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'The poll could not be updated.',
        'error',
      );
    } finally {
      setBusyId(null);
    }
  };

  const polls = query.data?.polls ?? [];

  return (
    <AdminScreen
      title="Polls"
      subtitle="One vote per customer, enforced by the database"
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <View style={styles.content}>
        <Button
          label="New poll"
          icon={Plus}
          onPress={() => router.push('/admin/poll-editor')}
        />

        {query.isLoading ? (
          <ScreenSkeleton blocks={3} />
        ) : query.isError ? (
          <ErrorState
            title="Polls unavailable"
            message="Check your connection and try again."
            onRetry={() => query.refetch()}
          />
        ) : polls.length === 0 ? (
          <Card>
            <EmptyState
              icon={Vote}
              title="No polls yet"
              body="Create a member poll with two to six options. Results stay hidden until you reveal them."
              actionLabel="Create poll"
              onAction={() => router.push('/admin/poll-editor')}
            />
          </Card>
        ) : (
          <View style={styles.stack}>
            {polls.map((item) => {
              const busy = busyId === item.id;
              return (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.topRow}>
                    <View style={styles.badges}>
                      <Badge
                        label={item.status === 'open' ? 'Open' : 'Closed'}
                        tone={item.status === 'open' ? 'green' : 'muted'}
                      />
                      <Badge
                        label={item.showResults ? 'Results visible' : 'Results hidden'}
                        tone={item.showResults ? 'orange' : 'muted'}
                      />
                    </View>
                    <AppText variant="small" color={colors.muted}>
                      {item.totalVotes} {item.totalVotes === 1 ? 'vote' : 'votes'}
                    </AppText>
                  </View>

                  <AppText variant="h3">{item.question}</AppText>
                  {item.description ? (
                    <AppText variant="small" color={colors.muted}>
                      {item.description}
                    </AppText>
                  ) : null}

                  <View style={styles.options}>
                    {item.options.map((option) => {
                      const percent =
                        item.totalVotes > 0
                          ? Math.round((option.votes / item.totalVotes) * 100)
                          : 0;
                      return (
                        <View key={option.id} style={styles.option}>
                          <View style={styles.optionTop}>
                            <AppText variant="small" color={colors.body} style={styles.flex}>
                              {option.label}
                            </AppText>
                            <AppText variant="smallStrong">
                              {option.votes} · {percent}%
                            </AppText>
                          </View>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, { width: `${percent}%` }]} />
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <AppText variant="small" color={colors.muted}>
                    {item.closesAt
                      ? `Closes ${formatDateTime(item.closesAt)}`
                      : 'No closing date set'}
                  </AppText>

                  <View style={styles.actions}>
                    <Button
                      label="Edit"
                      icon={Pencil}
                      variant="secondary"
                      size="sm"
                      fullWidth={false}
                      onPress={() =>
                        router.push({
                          pathname: '/admin/poll-editor',
                          params: { id: String(item.id) },
                        })
                      }
                      disabled={busy}
                    />
                    <Button
                      label={item.status === 'open' ? 'Close poll' : 'Reopen'}
                      variant={item.status === 'open' ? 'ghost' : 'primary'}
                      size="sm"
                      fullWidth={false}
                      onPress={() =>
                        patch(
                          item,
                          { status: item.status === 'open' ? 'closed' : 'open' },
                          item.status === 'open' ? 'Poll closed.' : 'Poll reopened.',
                        )
                      }
                      loading={busy}
                      disabled={busy}
                    />
                    <Button
                      label={item.showResults ? 'Hide results' : 'Show results'}
                      icon={item.showResults ? EyeOff : Eye}
                      variant="light"
                      size="sm"
                      fullWidth={false}
                      onPress={() =>
                        patch(
                          item,
                          { showResults: !item.showResults },
                          item.showResults
                            ? 'Results hidden from customers.'
                            : 'Results are now visible.',
                        )
                      }
                      disabled={busy}
                    />
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
  stack: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  flex: {
    flex: 1,
  },
  options: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  option: {
    gap: 5,
  },
  optionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.creamDeep,
    overflow: 'hidden',
  },
  barFill: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
