import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Trash2 } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { confirmAction } from '@/lib/confirm';
import type { AdminAnnouncement } from '@/lib/types';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { InlineMessage } from '@/components/InlineMessage';
import { ScreenSkeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/ToastProvider';

function SwitchRow({
  title,
  body,
  value,
  onValueChange,
}: {
  title: string;
  body: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.flex}>
        <AppText variant="smallStrong">{title}</AppText>
        <AppText variant="small" color={colors.muted}>
          {body}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.lineStrong, true: colors.orange }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.lineStrong}
        accessibilityLabel={title}
      />
    </View>
  );
}

export default function AnnouncementEditorScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? Number(params.id) : null;
  const editing = Number.isInteger(id) && id !== null && id > 0;

  const query = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: ({ signal }) =>
      apiGet<{ announcements: AdminAnnouncement[] }>(
        '/api/admin/announcements',
        signal,
      ),
  });

  const existing = editing
    ? query.data?.announcements.find((item) => item.id === id) ?? null
    : null;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [published, setPublished] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [initialised, setInitialised] = useState(!editing);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setBody(existing.body);
    setPublished(existing.published);
    setPinned(existing.pinned);
    setInitialised(true);
  }, [existing?.id]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
    queryClient.invalidateQueries({ queryKey: ['home'] });
  };

  const save = async () => {
    if (title.trim().length < 2) {
      setError('Add a title for the announcement.');
      return;
    }
    if (body.trim().length < 2) {
      setError('Add the announcement text.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      if (editing && id) {
        await apiPatch(`/api/admin/announcements/${id}`, {
          title: title.trim(),
          body: body.trim(),
          published,
          pinned,
        });
      } else {
        await apiPost('/api/admin/announcements', {
          title: title.trim(),
          body: body.trim(),
          published,
          pinned,
        });
      }
      showToast(
        published
          ? 'Announcement saved and published.'
          : 'Announcement saved as a draft.',
        'success',
      );
      refresh();
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'The announcement could not be saved.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!editing || !id) return;
    confirmAction(
      'Delete announcement?',
      'This removes it for every customer immediately.',
      'Delete',
      async () => {
        setDeleting(true);
        try {
          await apiDelete(`/api/admin/announcements/${id}`);
          showToast('Announcement deleted.', 'success');
          refresh();
          router.back();
        } catch (err) {
          showToast(
            err instanceof Error ? err.message : 'The announcement could not be deleted.',
            'error',
          );
        } finally {
          setDeleting(false);
        }
      },
    );
  };

  return (
    <AdminScreen
      title={editing ? 'Edit announcement' : 'New announcement'}
      subtitle="Customers see published items on Home"
    >
      {editing && query.isLoading ? (
        <ScreenSkeleton blocks={2} />
      ) : editing && !existing && !query.isLoading ? (
        <InlineMessage message="That announcement could not be found." tone="error" />
      ) : !initialised ? (
        <ScreenSkeleton blocks={2} />
      ) : (
        <View style={styles.content}>
          <Card style={styles.formCard}>
            <View style={styles.formHeading}>
              <View style={styles.iconCircle}>
                <Megaphone size={19} strokeWidth={2.1} color={colors.orangeDark} />
              </View>
              <AppText variant="small" color={colors.muted} style={styles.flex}>
                Keep it short and clear. Published announcements also create an
                in-app notification and a push alert.
              </AppText>
            </View>

            <TextField
              label="Title"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError(null);
              }}
              placeholder="Opening date confirmed"
              maxLength={120}
            />

            <TextField
              label="Announcement"
              value={body}
              onChangeText={(text) => {
                setBody(text);
                if (error) setError(null);
              }}
              placeholder="Share the details with the club…"
              multiline
              maxLength={2000}
              inputStyle={styles.bodyInput}
            />

            <SwitchRow
              title="Publish now"
              body="Publishing sends a notification to every member."
              value={published}
              onValueChange={setPublished}
            />
            <SwitchRow
              title="Pin to the top"
              body="Pinned announcements appear first on Home."
              value={pinned}
              onValueChange={setPinned}
            />

            {error ? <InlineMessage message={error} tone="error" /> : null}
          </Card>

          <Button
            label={published ? 'Save and publish' : 'Save draft'}
            loadingLabel="Saving…"
            loading={saving}
            onPress={save}
            disabled={saving || deleting}
          />
          {editing ? (
            <Button
              label="Delete announcement"
              icon={Trash2}
              variant="danger"
              loading={deleting}
              onPress={remove}
              disabled={saving || deleting}
            />
          ) : null}
        </View>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
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
    minHeight: 130,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
});
