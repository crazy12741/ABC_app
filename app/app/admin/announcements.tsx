import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { colors, spacing } from '@/constants/theme';
import { apiDelete, apiGet, apiPatch } from '@/lib/api';
import { confirmAction } from '@/lib/confirm';
import { formatDateTime } from '@/lib/format';
import type { AdminAnnouncement } from '@/lib/types';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { ScreenSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';

export default function AdminAnnouncementsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: ({ signal }) =>
      apiGet<{ announcements: AdminAnnouncement[] }>(
        '/api/admin/announcements',
        signal,
      ),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
    queryClient.invalidateQueries({ queryKey: ['home'] });
  };

  const toggle = async (item: AdminAnnouncement) => {
    setBusyId(item.id);
    try {
      await apiPatch(`/api/admin/announcements/${item.id}`, {
        published: !item.published,
      });
      showToast(
        item.published ? 'Announcement unpublished.' : 'Announcement published.',
        'success',
      );
      refresh();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'The change could not be saved.',
        'error',
      );
    } finally {
      setBusyId(null);
    }
  };

  const remove = (item: AdminAnnouncement) => {
    confirmAction(
      'Delete announcement?',
      `“${item.title}” will be removed for every customer.`,
      'Delete',
      async () => {
        setBusyId(item.id);
        try {
          await apiDelete(`/api/admin/announcements/${item.id}`);
          showToast('Announcement deleted.', 'success');
          refresh();
        } catch (error) {
          showToast(
            error instanceof Error ? error.message : 'The announcement could not be deleted.',
            'error',
          );
        } finally {
          setBusyId(null);
        }
      },
    );
  };

  const announcements = query.data?.announcements ?? [];

  return (
    <AdminScreen
      title="Announcements"
      subtitle="Published updates reach the home screen"
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <View style={styles.content}>
        <Button
          label="New announcement"
          icon={Plus}
          onPress={() => router.push('/admin/announcement-editor')}
        />

        {query.isLoading ? (
          <ScreenSkeleton blocks={3} />
        ) : query.isError ? (
          <ErrorState
            title="Announcements unavailable"
            message="Check your connection and try again."
            onRetry={() => query.refetch()}
          />
        ) : announcements.length === 0 ? (
          <Card>
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              body="Publish the opening date, venue or menu news. Published items appear on every member’s home screen."
              actionLabel="Create announcement"
              onAction={() => router.push('/admin/announcement-editor')}
            />
          </Card>
        ) : (
          <View style={styles.stack}>
            {announcements.map((item) => {
              const busy = busyId === item.id;
              return (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.topRow}>
                    <View style={styles.badges}>
                      <Badge
                        label={item.published ? 'Published' : 'Draft'}
                        tone={item.published ? 'green' : 'muted'}
                      />
                      {item.pinned ? <Badge label="Pinned" tone="orange" /> : null}
                    </View>
                    <AppText variant="small" color={colors.muted}>
                      {item.publishedAt
                        ? formatDateTime(item.publishedAt)
                        : formatDateTime(item.createdAt)}
                    </AppText>
                  </View>
                  <AppText variant="h3">{item.title}</AppText>
                  <AppText variant="small" color={colors.body}>
                    {item.body}
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
                          pathname: '/admin/announcement-editor',
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
