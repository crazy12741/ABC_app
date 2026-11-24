import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Gift, Mail, User } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';
import { apiPost } from '@/lib/api';
import { formatPhone } from '@/lib/format';
import type { Profile } from '@/lib/types';
import { AppText } from '@/components/AppText';
import { BrandLockup } from '@/components/Logo';
import { Button } from '@/components/Button';
import { InlineMessage } from '@/components/InlineMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/ToastProvider';

export default function OnboardingScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: session, refetch } = authClient.useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const phone = session?.user?.phoneNumber ?? '';
  const canSubmit = name.trim().length >= 2 && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSaving(true);

    try {
      await apiPost<{ profile: Profile }>('/api/profile/complete', {
        name: name.trim(),
        email: email.trim().length > 0 ? email.trim() : undefined,
        referralCode:
          referralCode.trim().length > 0 ? referralCode.trim().toUpperCase() : undefined,
      });

      showToast('You’re in. Welcome to the club!', 'success');
      queryClient.invalidateQueries();
      await refetch();
      router.replace('/(tabs)');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'We could not save your details.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <BrandLockup size={36} />
      </View>

      <View style={styles.heading}>
        <AppText variant="caption" color={colors.orangeDark}>
          Almost there
        </AppText>
        <AppText variant="h1">Tell us who’s joining</AppText>
        <AppText variant="body" color={colors.muted}>
          Your number is verified. Add your details so the club can personalise
          your experience.
        </AppText>
      </View>

      <View style={styles.verified}>
        <View style={styles.verifiedDot} />
        <View style={styles.verifiedCopy}>
          <AppText variant="smallStrong" color={colors.success}>
            Number verified
          </AppText>
          <AppText variant="small" color={colors.muted}>
            {formatPhone(phone)}
          </AppText>
        </View>
      </View>

      <View style={styles.form}>
        <TextField
          label="Full name"
          icon={User}
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (error) setError(null);
          }}
          placeholder="Your name"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          maxLength={60}
          returnKeyType="next"
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
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          maxLength={200}
          returnKeyType="next"
        />

        <TextField
          label="Referral code"
          hint="Optional"
          icon={Gift}
          value={referralCode}
          onChangeText={(text) => {
            setReferralCode(text.toUpperCase());
            if (error) setError(null);
          }}
          placeholder="ABC-XXXXX"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={20}
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        {error ? <InlineMessage message={error} tone="error" /> : null}

        <Button
          label="Enter the club"
          loadingLabel="Saving your details…"
          loading={saving}
          onPress={submit}
          disabled={!canSubmit}
        />

        <AppText variant="small" color={colors.muted} style={styles.footnote}>
          You can add or change your email later from Profile. Your mobile
          number stays verified and private.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  topBar: {
    paddingVertical: spacing.xs,
  },
  heading: {
    gap: spacing.sm,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BEE3CF',
    padding: spacing.md,
  },
  verifiedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  verifiedCopy: {
    flex: 1,
    gap: 1,
  },
  form: {
    gap: spacing.lg,
  },
  footnote: {
    textAlign: 'center',
    lineHeight: 18,
  },
});
