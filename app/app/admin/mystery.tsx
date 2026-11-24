import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Sparkles, Trash2 } from 'lucide-react-native';
import { colors, spacing } from '@/constants/theme';
import { apiDelete, apiGet, apiPatch } from '@/lib/api';
import { confirmAction } from '@/lib/confirm';
import { formatDateTime, relativeTime } from '@/lib/format';
import type { AdminMysteryClue } from '@/lib/types';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { ScreenSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';

export default function AdminMysteryScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'mystery'],
    queryFn: ({ signal }) =>
      apiGet<{ clues: AdminMysteryClue[] }>('/api/admin/mystery', signal),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'mystery'] });
    queryClient.invalidateQueries({ queryKey: ['home'] });
    queryClient.invalidateQueries({ queryKey: ['mystery'] });
  };

  const toggle = async (item: AdminMysteryClue) => {
    setBusyId(item.id);
    try {
      await apiPatch(`/api/admin/mystery/${item.id}`, {
        published: !item.published,
      });
      showToast(
        item.published ? 'Clue moved back to draft.' : 'Clue published.',
        'success',
      );
      refresh();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'The clue could not be updated.',
        'error',
      );
    } finally {
      setBusyId(null);
    }
  };

  const remove = (item: AdminMysteryClue) => {
    confirmAction(
      'Delete clue?',
      `Clue #${item.clueNumber}, “${item.title}”, will be removed for every customer.`,
      'Delete',
      async () => {
        setBusyId(item.id);
        try {
          await apiDelete(`/api/admin/mystery/${item.id}`);
          showToast('Clue deleted.', 'success');
          refresh();
        } catch (error) {
          showToast(
            error instanceof Error ? error.message : 'The clue could not be deleted.',
            'error',
          );
        } finally {
          setBusyId(null);
        }
      },
    );
  };

  const clues = query.data?.clues ?? [];

  return (
    <AdminScreen
      title="Mystery clues"
      subtitle="Published clues appear in the Mystery tab"
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <View style={styles.content}>
        <Button
          label="New clue"
          icon={Plus}
          onPress={() => router.push('/admin/mystery-editor')}
        />

        {query.isLoading ? (
          <ScreenSkeleton blocks={3} />
        ) : query.isError ? (
          <ErrorState
            title="Clues unavailable"
            message="Check your connection and try again."
            onRetry={() => query.refetch()}
          />
        ) : clues.length === 0 ? (
          <Card>
            <EmptyState
              icon={Sparkles}
              title="No clues yet"
              body="Draft the first clue and publish it when the club is ready. Publishing sends a push alert."
              actionLabel="Create clue"
              onAction={() => router.push('/admin/mystery-editor')}
            />
          </Card>
        ) : (
          <View style={styles.stack}>
            {clues.map((item) => {
              const busy = busyId === item.id;
              return (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.topRow}>
                    <View style={styles.badges}>
                      <Badge label={`Clue #${item.clueNumber}`} tone="charcoal" />
                      <Badge
                        label={item.published ? 'Published' : 'Draft'}
                        tone={item.published ? 'green' : 'muted'}
                      />
                    </View>
                    <AppText variant="small" color={colors.muted}>
                      {item.publishedAt
                        ? relativeTime(item.publishedAt)
                        : formatDateTime(item.createdAt)}
                    </AppText>
                  </View>
                  <AppText variant="h3">{item.title}</AppText>
                  <AppText variant="small" color={colors.body} numberOfLines={3}>
                    {item.body}
                  </AppText>
                  {item.imageUrl ? (
                    <AppText variant="small" color={colors.muted} numberOfLines={1}>
                      Image: {item.imageUrl}
                    </AppText>
                  ) : null}
                  <View style={styles.actions}>
                    <Button
                      label="Edit"
                      icon={Pencil}
                      variant="secondary"
                      size="sm"
                      fullWidth={false}
                      onPress={() =>
                        router.push({
                          pathname: '/admin/mystery-editor',
                          params: { id: String(item.id) },
                        })
                      }
                      disabled={busy}
                    />
                    <Button
                      label={item.published ? 'Unpublish' : 'Publish'}
                      variant={item.published ? 'ghost' : 'primary'}
                      size="sm"
                      fullWidth={false}
                      onPress={() => toggle(item)}
                      loading={busy}
                      disabled={busy}
                    />
                    <Button
                      label="Delete"
                      icon={Trash2}
                      variant="danger"
                      size="sm"
                      fullWidth={false}
                      onPress={() => remove(item)}
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
