import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Lock, Vote as VoteIcon } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { useSignedIn } from '@/hooks/useSignedIn';
import { apiGet } from '@/lib/api';
import type { PollsData } from '@/lib/types';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { PollCard } from '@/components/PollCard';
import { Screen } from '@/components/Screen';
import { ScreenSkeleton } from '@/components/Skeleton';
import { useVotePoll } from '@/hooks/useVotePoll';

type Filter = 'open' | 'closed';

export default function VoteScreen() {
  const [filter, setFilter] = useState<Filter>('open');
  const { vote, votingId, errorFor } = useVotePoll();
  const signedIn = useSignedIn();
  const query = useQuery({
    queryKey: ['polls'],
    queryFn: ({ signal }) => apiGet<PollsData>('/api/polls', signal),
    enabled: signedIn,
  });

  const polls = query.data?.polls ?? [];
  const openCount = useMemo(() => polls.filter((poll) => poll.isOpen).length, [polls]);
  const closedCount = polls.length - openCount;
  const visible = useMemo(
    () => polls.filter((poll) => (filter === 'open' ? poll.isOpen : !poll.isOpen)),
    [polls, filter],
  );

  if (query.isLoading) {
    return (
      <Screen>
        <ScreenSkeleton />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <ErrorState
          title="The ballot is closed"
          message="We could not load the polls right now. Pull to refresh or try again."
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
          Member polls
        </AppText>
        <AppText variant="h1">Have your say</AppText>
        <AppText variant="body" color={colors.muted}>
          Every verified number gets one vote per poll. Results appear only when
          the club chooses to share them.
        </AppText>
      </View>

      <View style={styles.segment}>
        {(
          [
            { key: 'open' as Filter, label: 'Open', count: openCount },
            { key: 'closed' as Filter, label: 'Closed', count: closedCount },
          ]
        ).map((item) => {
          const active = filter === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setFilter(item.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.segmentItem,
                active && styles.segmentItemActive,
                pressed && styles.pressed,
              ]}
            >
              <AppText
                variant="smallStrong"
                color={active ? colors.white : colors.muted}
              >
                {item.label}
              </AppText>
              <View
                style={[
                  styles.count,
                  active ? styles.countActive : styles.countInactive,
                ]}
              >
                <AppText
                  style={[
                    styles.countText,
                    { color: active ? colors.white : colors.muted },
                  ]}
                >
                  {item.count}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Card tone="cream" style={styles.note}>
        <Lock size={17} strokeWidth={2.2} color={colors.orangeDark} />
        <AppText variant="small" color={colors.muted} style={styles.flex}>
          Votes are final and tied to your verified number. Duplicate votes are
          blocked by the backend.
        </AppText>
      </Card>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={VoteIcon}
            title={filter === 'open' ? 'No open polls right now' : 'No closed polls yet'}
            body={
              filter === 'open'
                ? 'When the club publishes a new poll it will appear here. Pull down to refresh.'
                : 'Closed polls and their final results will collect here.'
            }
            actionLabel={filter === 'open' ? 'View closed polls' : 'View open polls'}
            onAction={() => setFilter(filter === 'open' ? 'closed' : 'open')}
          />
        </Card>
      ) : (
        <View style={styles.stack}>
          {visible.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={(pollId, optionId) => vote({ pollId, optionId })}
              voting={votingId === poll.id}
              error={errorFor(poll.id)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  heading: {
    gap: spacing.xs,
  },
  segment: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 5,
  },
  segmentItem: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  segmentItemActive: {
    backgroundColor: colors.charcoal,
  },
  pressed: {
    opacity: 0.8,
  },
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  countInactive: {
    backgroundColor: colors.creamDeep,
  },
  countText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
    lineHeight: 19,
  },
  stack: {
    gap: spacing.md,
  },
});
