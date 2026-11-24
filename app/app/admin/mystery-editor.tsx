import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Trash2 } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { confirmAction } from '@/lib/confirm';
import type { AdminMysteryClue } from '@/lib/types';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { InlineMessage } from '@/components/InlineMessage';
import { ScreenSkeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/ToastProvider';

export default function MysteryEditorScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? Number(params.id) : null;
  const editing = Number.isInteger(id) && id !== null && id > 0;

  const query = useQuery({
    queryKey: ['admin', 'mystery'],
    queryFn: ({ signal }) =>
      apiGet<{ clues: AdminMysteryClue[] }>('/api/admin/mystery', signal),
  });

  const existing = editing
    ? query.data?.clues.find((item) => item.id === id) ?? null
    : null;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [published, setPublished] = useState(false);
  const [initialised, setInitialised] = useState(!editing);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setBody(existing.body);
    setImageUrl(existing.imageUrl ?? '');
    setPublished(existing.published);
    setInitialised(true);
  }, [existing?.id]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'mystery'] });
    queryClient.invalidateQueries({ queryKey: ['home'] });
    queryClient.invalidateQueries({ queryKey: ['mystery'] });
  };

  const save = async () => {
    if (title.trim().length < 2) {
      setError('Add a title for the clue.');
      return;
    }
    if (body.trim().length < 2) {
      setError('Add the clue text.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      if (editing && id) {
        await apiPatch(`/api/admin/mystery/${id}`, {
          title: title.trim(),
          body: body.trim(),
          imageUrl: imageUrl.trim().length > 0 ? imageUrl.trim() : null,
          published,
        });
      } else {
        await apiPost('/api/admin/mystery', {
          title: title.trim(),
          body: body.trim(),
          imageUrl: imageUrl.trim(),
          published,
        });
      }
      showToast(
        published ? 'Clue saved and published.' : 'Clue saved as a draft.',
        'success',
      );
      refresh();
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'The clue could not be saved.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!editing || !id) return;
    confirmAction(
      'Delete clue?',
      'This removes the clue for every customer immediately.',
      'Delete',
      async () => {
        setDeleting(true);
        try {
          await apiDelete(`/api/admin/mystery/${id}`);
          showToast('Clue deleted.', 'success');
          refresh();
          router.back();
        } catch (err) {
          showToast(
            err instanceof Error ? err.message : 'The clue could not be deleted.',
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
      title={editing ? 'Edit clue' : 'New mystery clue'}
      subtitle="Publishing sends a push alert"
    >
      {editing && query.isLoading ? (
        <ScreenSkeleton blocks={2} />
      ) : editing && !existing && !query.isLoading ? (
        <InlineMessage message="That clue could not be found." tone="error" />
      ) : !initialised ? (
        <ScreenSkeleton blocks={2} />
      ) : (
        <View style={styles.content}>
          <Card style={styles.formCard}>
            <View style={styles.formHeading}>
              <View style={styles.iconCircle}>
                <Sparkles size={19} strokeWidth={2.1} color={colors.orangeDark} />
              </View>
              <AppText variant="small" color={colors.muted} style={styles.flex}>
                Clue numbers are assigned automatically. Use a real image URL
                from the club’s photo library.
              </AppText>
            </View>

            <TextField
              label="Clue title"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError(null);
              }}
              placeholder="The bun is not what it seems"
              maxLength={120}
            />

            <TextField
              label="Clue"
              value={body}
              onChangeText={(text) => {
                setBody(text);
                if (error) setError(null);
              }}
              placeholder="Reveal one detail about what is coming…"
              multiline
              maxLength={2000}
              inputStyle={styles.bodyInput}
            />

            <TextField
              label="Image URL"
              hint="Optional"
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://…"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              maxLength={500}
            />

            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <AppText variant="smallStrong">Publish now</AppText>
                <AppText variant="small" color={colors.muted}>
                  Sends a notification that the new clue is live.
                </AppText>
              </View>
              <Switch
                value={published}
                onValueChange={setPublished}
                trackColor={{ false: colors.lineStrong, true: colors.orange }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.lineStrong}
                accessibilityLabel="Publish now"
              />
            </View>

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
              label="Delete clue"
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
    minHeight: 120,
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
