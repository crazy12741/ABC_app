import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Vote, X } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { combineDateTime, splitDateTime } from '@/lib/format';
import type { AdminPoll } from '@/lib/types';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { InlineMessage } from '@/components/InlineMessage';
import { ScreenSkeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/ToastProvider';

export default function PollEditorScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? Number(params.id) : null;
  const editing = Number.isInteger(id) && id !== null && id > 0;

  const query = useQuery({
    queryKey: ['admin', 'polls'],
    queryFn: ({ signal }) =>
      apiGet<{ polls: AdminPoll[] }>('/api/admin/polls', signal),
  });

  const existing = editing
    ? query.data?.polls.find((item) => item.id === id) ?? null
    : null;

  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [status, setStatus] = useState<'open' | 'closed'>('open');
  const [showResults, setShowResults] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [addOption, setAddOption] = useState('');
  const [initialised, setInitialised] = useState(!editing);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setQuestion(existing.question);
    setDescription(existing.description ?? '');
    setStatus(existing.status === 'closed' ? 'closed' : 'open');
    setShowResults(existing.showResults);
    const parts = splitDateTime(existing.closesAt);
    setDate(parts.date);
    setTime(parts.time || '09:00');
    setInitialised(true);
  }, [existing?.id]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'polls'] });
    queryClient.invalidateQueries({ queryKey: ['polls'] });
    queryClient.invalidateQueries({ queryKey: ['home'] });
  };

  const updateOption = (index: number, value: string) => {
    setOptions((current) =>
      current.map((option, optionIndex) => (optionIndex === index ? value : option)),
    );
  };

  const addRow = () => {
    if (options.length >= 6) return;
    setOptions((current) => [...current, '']);
  };

  const removeRow = (index: number) => {
    if (options.length <= 2) return;
    setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index));
  };

  const save = async () => {
    if (question.trim().length < 3) {
      setError('Add a poll question.');
      return;
    }

    let closesAt: string | null = null;
    if (date.trim().length > 0 || time.trim().length > 0) {
      closesAt = combineDateTime(date.trim(), time.trim());
      if (!closesAt) {
        setError('Enter a valid closing date and time, or leave both blank.');
        return;
      }
    }

    setError(null);
    setSaving(true);

    try {
      if (editing && id) {
        if (addOption.trim()) {
          const duplicate = existing?.options.some(
            (option) => option.label.toLowerCase() === addOption.trim().toLowerCase(),
          );
          if (duplicate) {
            setError('That option already exists.');
            setSaving(false);
            return;
          }
        }

        await apiPatch(`/api/admin/polls/${id}`, {
          question: question.trim(),
          description: description.trim().length > 0 ? description.trim() : null,
          status,
          showResults,
          closesAt,
          ...(addOption.trim() ? { addOption: addOption.trim() } : {}),
        });
        showToast('Poll updated.', 'success');
      } else {
        const labels = options.map((option) => option.trim()).filter(Boolean);
        if (labels.length < 2) {
          setError('Add at least two options.');
          setSaving(false);
          return;
        }
        const unique = new Set(labels.map((label) => label.toLowerCase()));
        if (unique.size !== labels.length) {
          setError('Each option needs a different label.');
          setSaving(false);
          return;
        }

        const created = await apiPost<{ poll: AdminPoll }>('/api/admin/polls', {
          question: question.trim(),
          description: description.trim(),
          options: labels,
          showResults,
          closesAt,
        });

        if (status === 'closed' && created.poll) {
          await apiPatch(`/api/admin/polls/${created.poll.id}`, { status: 'closed' });
        }
        showToast('Poll created.', 'success');
      }

      refresh();
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'The poll could not be saved.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminScreen
      title={editing ? 'Edit poll' : 'New poll'}
      subtitle="One vote per verified member"
    >
      {editing && query.isLoading ? (
        <ScreenSkeleton blocks={2} />
      ) : editing && !existing && !query.isLoading ? (
        <InlineMessage message="That poll could not be found." tone="error" />
      ) : !initialised ? (
        <ScreenSkeleton blocks={2} />
      ) : (
        <View style={styles.content}>
          <Card style={styles.formCard}>
            <View style={styles.formHeading}>
              <View style={styles.iconCircle}>
                <Vote size={19} strokeWidth={2.1} color={colors.orangeDark} />
              </View>
              <AppText variant="small" color={colors.muted} style={styles.flex}>
                Customers see results only when you switch them on. Votes cannot
                be changed after they are cast.
              </AppText>
            </View>

            <TextField
              label="Question"
              value={question}
              onChangeText={(text) => {
                setQuestion(text);
                if (error) setError(null);
              }}
              placeholder="Which burger should lead the menu?"
              maxLength={160}
            />

            <TextField
              label="Description"
              hint="Optional"
              value={description}
              onChangeText={setDescription}
              placeholder="Give members a little context…"
              multiline
              maxLength={600}
              inputStyle={styles.descriptionInput}
            />

            {editing && existing ? (
              <View style={styles.existingOptions}>
                <AppText variant="label">Options</AppText>
                <View style={styles.chips}>
                  {existing.options.map((option) => (
                    <Badge
                      key={option.id}
                      label={`${option.label} · ${option.votes}`}
                      tone="muted"
                    />
                  ))}
                </View>
                <AppText variant="small" color={colors.muted}>
                  Existing labels cannot be renamed. You can add one more option
                  while the poll has no votes.
                </AppText>
              </View>
            ) : (
              <View style={styles.options}>
                <View style={styles.optionsHeader}>
                  <AppText variant="label">Options</AppText>
                  <AppText variant="small" color={colors.muted}>
                    {options.length} of 6
                  </AppText>
                </View>
                {options.map((option, index) => (
                  <View key={index} style={styles.optionRow}>
                    <TextField
                      containerStyle={styles.flex}
                      label={`Option ${index + 1}`}
                      value={option}
                      onChangeText={(text) => updateOption(index, text)}
                      placeholder="Option label"
                      maxLength={60}
                    />
                    {options.length > 2 ? (
                      <Pressable
                        onPress={() => removeRow(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove option ${index + 1}`}
                        style={({ pressed }) => [
                          styles.remove,
                          pressed && styles.pressed,
                        ]}
                      >
                        <X size={18} strokeWidth={2.3} color={colors.danger} />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
                {options.length < 6 ? (
                  <Button
                    label="Add another option"
                    icon={Plus}
                    variant="ghost"
                    size="sm"
                    fullWidth={false}
                    onPress={addRow}
                  />
                ) : null}
              </View>
            )}

            {editing && existing && existing.totalVotes === 0 ? (
              <TextField
                label="Add an option"
                hint="Before the first vote"
                value={addOption}
                onChangeText={setAddOption}
                placeholder="Optional new label"
                maxLength={60}
              />
            ) : null}

            <View style={styles.dateRow}>
              <TextField
                label="Closes on"
                hint="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
                placeholder="2026-12-31"
                autoCapitalize="none"
                maxLength={10}
                containerStyle={styles.flex}
              />
              <TextField
                label="Time"
                hint="24h"
                value={time}
                onChangeText={setTime}
                placeholder="21:00"
                maxLength={5}
                containerStyle={styles.flex}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <AppText variant="smallStrong">Open for voting</AppText>
                <AppText variant="small" color={colors.muted}>
                  Close it any time from the poll list.
                </AppText>
              </View>
              <Switch
                value={status === 'open'}
                onValueChange={(next) => setStatus(next ? 'open' : 'closed')}
                trackColor={{ false: colors.lineStrong, true: colors.orange }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.lineStrong}
                accessibilityLabel="Open for voting"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <AppText variant="smallStrong">Show results</AppText>
                <AppText variant="small" color={colors.muted}>
                  Customers can see vote counts and percentages.
                </AppText>
              </View>
              <Switch
                value={showResults}
                onValueChange={setShowResults}
                trackColor={{ false: colors.lineStrong, true: colors.orange }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.lineStrong}
                accessibilityLabel="Show results"
              />
            </View>

            {error ? <InlineMessage message={error} tone="error" /> : null}
          </Card>

          <Button
            label={editing ? 'Save poll' : 'Create poll'}
            loadingLabel="Saving…"
            loading={saving}
            onPress={save}
            disabled={saving}
          />
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
  descriptionInput: {
    minHeight: 84,
  },
  options: {
    gap: spacing.md,
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  remove: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  existingOptions: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
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
