import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Send } from 'lucide-react-native';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPost } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { InlineMessage } from '@/components/InlineMessage';
import { ScreenSkeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/ToastProvider';

type Broadcast = {
  id: number;
  title: string;
  body: string;
  type: string;
  createdAt: string;
};

export default function AdminNotificationsScreen() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sentInfo, setSentInfo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'broadcasts'],
    queryFn: ({ signal }) =>
      apiGet<{ broadcasts: Broadcast[] }>('/api/admin/notifications', signal),
  });

  const send = async () => {
    if (title.trim().length < 2) {
      setError('Add a notification title.');
      return;
    }
    if (body.trim().length < 2) {
      setError('Add the message customers will see.');
      return;
    }

    setError(null);
    setSentInfo(null);
    setSending(true);
    try {
      const result = await apiPost<{
        notification: Broadcast;
        push: { sent: number; removed: number };
      }>('/api/admin/notifications', {
        title: title.trim(),
        body: body.trim(),
        type: 'general',
      });

      const pushLine =
        result.push.sent > 0
          ? `Push delivered to ${result.push.sent} device${result.push.sent === 1 ? '' : 's'}.`
          : 'Saved in-app. No push tokens were registered, so no device alert was sent.';

      setSentInfo(pushLine);
      showToast('Broadcast sent.', 'success');
      setTitle('');
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'broadcasts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'The broadcast could not be sent.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSending(false);
    }
  };

  const broadcasts = query.data?.broadcasts ?? [];

  return (
    <AdminScreen
      title="Broadcast"
      subtitle="In-app notification and push alert"
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <View style={styles.content}>
        <Card style={styles.formCard}>
          <View style={styles.formHeading}>
            <View style={styles.iconCircle}>
              <Bell size={19} strokeWidth={2.1} color={colors.orangeDark} />
            </View>
            <AppText variant="small" color={colors.muted} style={styles.flex}>
              Every verified member receives this in the app. Members with push
              notifications enabled also get a device alert.
            </AppText>
          </View>

          <TextField
            label="Title"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (error) setError(null);
              if (sentInfo) setSentInfo(null);
            }}
            placeholder="Doors open this Friday"
            maxLength={100}
          />
          <TextField
            label="Message"
            value={body}
            onChangeText={(text) => {
              setBody(text);
              if (error) setError(null);
              if (sentInfo) setSentInfo(null);
            }}
            placeholder="Keep it short and useful…"
            multiline
            maxLength={300}
            inputStyle={styles.bodyInput}
          />

          {error ? <InlineMessage message={error} tone="error" /> : null}
          {sentInfo ? <InlineMessage message={sentInfo} tone="success" /> : null}

          <Button
            label="Send broadcast"
            icon={Send}
            loadingLabel="Sending…"
            loading={sending}
            onPress={send}
            disabled={sending}
          />
        </Card>

        <View>
          <AppText variant="h2" style={styles.listTitle}>
            Recent broadcasts
          </AppText>
          {query.isLoading ? (
            <ScreenSkeleton blocks={2} />
          ) : query.isError ? (
            <ErrorState
              title="Broadcasts unavailable"
              message="Check your connection and try again."
              onRetry={() => query.refetch()}
            />
          ) : broadcasts.length === 0 ? (
            <Card>
              <EmptyState
                icon={Bell}
                title="No broadcasts yet"
                body="Your sent notifications will be listed here with the time they went out."
              />
            </Card>
          ) : (
            <View style={styles.stack}>
              {broadcasts.map((item) => (
                <Card key={item.id} style={styles.broadcast}>
                  <View style={styles.broadcastTop}>
                    <Badge label="Broadcast" tone="orange" />
                    <AppText variant="small" color={colors.muted}>
                      {relativeTime(item.createdAt)}
                    </AppText>
                  </View>
                  <AppText variant="h3">{item.title}</AppText>
                  <AppText variant="small" color={colors.body}>
                    {item.body}
                  </AppText>
                </Card>
              ))}
            </View>
          )}
        </View>
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  formCard: {
    gap: spacing.lg,
  },
  formHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
    lineHeight: 20,
  },
  bodyInput: {
    minHeight: 90,
  },
  listTitle: {
    marginBottom: spacing.md,
  },
  stack: {
    gap: spacing.md,
  },
  broadcast: {
    gap: spacing.sm,
  },
  broadcastTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
