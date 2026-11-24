import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { useSignedIn } from '@/hooks/useSignedIn';
import { apiGet, apiPost } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import type { NotificationView } from '@/lib/types';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Screen } from '@/components/Screen';
import { ScreenSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';

type NotificationsData = {
  notifications: NotificationView[];
  unread: number;
};

function typeLabel(type: string): string {
  if (type === 'mystery') return 'Mystery';
  if (type === 'announcement') return 'Announcement';
  if (type === 'poll') return 'Poll';
  if (type === 'welcome') return 'Welcome';
  return 'Club';
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const signedIn = useSignedIn();
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: ({ signal }) => apiGet<NotificationsData>('/api/notifications', signal),
    enabled: signedIn,
  });

  const data = query.data;
  const unread = data?.unread ?? 0;

  const markAll = async () => {
    try {
      await apiPost('/api/notifications/read', { all: true });
      showToast('All notifications marked as read.', 'success');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    } catch {
      showToast('We could not mark them as read. Try again.', 'error');
    }
  };

  const openNotification = async (item: NotificationView) => {
    if (item.read) return;
    try {
      await apiPost('/api/notifications/read', { id: item.id });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    } catch {
      showToast('We could not update that notification.', 'error');
    }
  };

  const header = useMemo(
    () => (
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          hitSlop={10}
        >
          <ArrowLeft size={20} strokeWidth={2.3} color={colors.charcoal} />
        </Pressable>
        <View style={styles.flex}>
          <AppText variant="h2">Notifications</AppText>
          <AppText variant="small" color={colors.muted}>
            {unread > 0 ? `${unread} unread` : 'You are all caught up'}
          </AppText>
        </View>
        {unread > 0 ? (
          <Pressable
            onPress={markAll}
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
            style={({ pressed }) => [styles.markAll, pressed && styles.pressed]}
          >
            <CheckCheck size={16} strokeWidth={2.2} color={colors.orangeDark} />
            <AppText variant="smallStrong" color={colors.orangeDark}>
              Mark all
            </AppText>
          </Pressable>
        ) : null}
      </View>
    ),
    [unread, router],
  );

  if (query.isLoading) {
    return (
      <Screen>
        {header}
        <ScreenSkeleton blocks={3} />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Notifications are unavailable"
          message="Check your connection and try again."
          onRetry={() => query.refetch()}
        />
      </Screen>
    );
  }

  if (!data || data.notifications.length === 0) {
    return (
      <Screen>
        {header}
        <Card>
          <EmptyState
            icon={Bell}
            title="Nothing new yet"
            body="Club announcements, new mystery clues and poll alerts will land here."
            actionLabel="Back to home"
            onAction={() => router.replace('/(tabs)')}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      contentContainerStyle={styles.content}
    >
      {header}

      <View style={styles.stack}>
        {data.notifications.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => openNotification(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.read ? 'Read' : 'Unread'}`}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Card style={[styles.notification, !item.read ? styles.unread : null]}>
              <View style={styles.notificationTop}>
                <Badge
                  label={typeLabel(item.type)}
                  tone={item.type === 'mystery' ? 'orange' : 'muted'}
                />
                <View style={styles.timeRow}>
                  {!item.read ? <View style={styles.unreadDot} /> : null}
                  <AppText variant="small" color={colors.muted}>
                    {relativeTime(item.createdAt)}
                  </AppText>
                </View>
              </View>
              <AppText variant="h3">{item.title}</AppText>
              <AppText variant="small" color={colors.body}>
                {item.body}
              </AppText>
            </Card>
          </Pressable>
        ))}
      </View>

      <Button
        label="Back to home"
        variant="secondary"
        onPress={() => router.replace('/(tabs)')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.orangeSoft,
  },
  pressed: {
    opacity: 0.72,
  },
  stack: {
    gap: spacing.md,
  },
  notification: {
    gap: spacing.sm,
  },
  unread: {
    borderColor: colors.orange,
    backgroundColor: '#FFF9F2',
  },
  notificationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
});
