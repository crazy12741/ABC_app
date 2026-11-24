import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, User } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { useSignedIn } from '@/hooks/useSignedIn';
import { apiGet, apiPatch } from '@/lib/api';
import { formatPhone } from '@/lib/format';
import type { Profile, ProfileData } from '@/lib/types';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/StateViews';
import { InlineMessage } from '@/components/InlineMessage';
import { Screen } from '@/components/Screen';
import { ScreenSkeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/ToastProvider';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const signedIn = useSignedIn();
  const query = useQuery({
    queryKey: ['profile'],
    queryFn: ({ signal }) => apiGet<ProfileData>('/api/profile', signal),
    enabled: signedIn,
  });

  const profile = query.data?.profile;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setEmail(profile.email ?? '');
    setEmailUpdates(profile.emailUpdates);
  }, [profile?.id]);

  const save = async () => {
    if (name.trim().length < 2) {
      setError('Enter your name to save changes.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await apiPatch<{ profile: Profile }>('/api/profile', {
        name: name.trim(),
        email: email.trim(),
        emailUpdates,
      });
      showToast('Profile updated.', 'success');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'We could not save your changes.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (query.isLoading) {
    return (
      <Screen>
        <ScreenSkeleton blocks={2} />
      </Screen>
    );
  }

  if (query.isError || !profile) {
    return (
      <Screen contentContainerStyle={styles.content}>
        <ErrorState
          title="Profile is unavailable"
          message="Check your connection and try again."
          onRetry={() => query.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
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
        <AppText variant="h2" style={styles.flex}>
          Edit profile
        </AppText>
      </View>

      <View style={styles.heading}>
        <AppText variant="body" color={colors.muted}>
          Keep your details current. Your verified mobile number is managed by
          the club and cannot be edited here.
        </AppText>
      </View>

      <Card style={styles.phoneCard}>
        <AppText variant="small" color={colors.muted}>
          Verified mobile
        </AppText>
        <AppText variant="bodyStrong">{formatPhone(profile.phoneNumber)}</AppText>
        <AppText variant="small" color={colors.muted}>
          To use a different number, sign out and verify the new number.
        </AppText>
      </Card>

      <View style={styles.form}>
        <TextField
          label="Full name"
          icon={User}
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (error) setError(null);
          }}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          maxLength={60}
        />

        <TextField
          label="Email"
          hint="Optional"
          icon={Mail}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          maxLength={200}
          placeholder="you@example.com"
        />

        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <AppText variant="smallStrong">Email updates</AppText>
            <AppText variant="small" color={colors.muted}>
              Occasional club news and opening updates.
            </AppText>
          </View>
          <Switch
            value={emailUpdates}
            onValueChange={setEmailUpdates}
            disabled={!email.trim()}
            trackColor={{ false: colors.lineStrong, true: colors.orange }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.lineStrong}
            accessibilityLabel="Email updates"
          />
        </View>

        {error ? <InlineMessage message={error} tone="error" /> : null}

        <Button
          label="Save changes"
          loadingLabel="Saving…"
          loading={saving}
          onPress={save}
          disabled={name.trim().length < 2}
        />
        <Button
          label="Cancel"
          variant="secondary"
          onPress={() => router.back()}
          disabled={saving}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
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
  pressed: {
    opacity: 0.72,
  },
  flex: {
    flex: 1,
  },
  heading: {
    gap: spacing.sm,
  },
  phoneCard: {
    gap: 2,
  },
  form: {
    gap: spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
});
