import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';
import { authErrorMessage } from '@/lib/auth-errors';
import { formatPhone } from '@/lib/format';
import { AppText } from '@/components/AppText';
import { BrandLockup } from '@/components/Logo';
import { Button } from '@/components/Button';
import { InlineMessage } from '@/components/InlineMessage';
import { OtpInput } from '@/components/OtpInput';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/ToastProvider';

const RESEND_SECONDS = 60;

export default function VerifyScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { refetch } = authClient.useSession();
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = typeof params.phone === 'string' ? params.phone : '';
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => {
      setResendIn((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const verify = async () => {
    if (submitting || code.length !== 6 || !phone) return;
    setError(null);
    setSubmitting(true);

    try {
      const { error: verifyError } = await authClient.phoneNumber.verify({
        phoneNumber: phone,
        code,
      });

      if (verifyError) {
        const message = authErrorMessage(
          verifyError,
          'That code could not be verified. Please try again.',
        );
        setError(message);
        setCode('');
        showToast(message, 'error');
        return;
      }

      showToast('Number verified. Welcome to the club!', 'success');
      await refetch();
      router.replace('/(tabs)');
    } catch {
      const message = 'Check your connection and try again.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0 || resending || !phone) return;
    setResending(true);
    setError(null);

    try {
      const { error: sendError } = await authClient.phoneNumber.sendOtp({
        phoneNumber: phone,
      });
      if (sendError) {
        const message = authErrorMessage(
          sendError,
          'We could not resend your code. Try again shortly.',
        );
        setError(message);
        showToast(message, 'error');
        return;
      }
      setCode('');
      setResendIn(RESEND_SECONDS);
      showToast('A fresh code is on its way.', 'success');
    } catch {
      const message = 'Check your connection and try again.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setResending(false);
    }
  };

  const resendLabel =
    resendIn > 0
      ? `Resend code in 0:${String(resendIn).padStart(2, '0')}`
      : resending
        ? 'Sending a new code…'
        : 'Resend code';

  if (!phone) {
    return (
      <Screen contentContainerStyle={styles.content}>
        <InlineMessage
          message="We lost track of that number. Enter it again to continue."
          tone="error"
        />
        <Button
          label="Enter my number"
          onPress={() => router.replace('/(auth)/phone')}
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.replace('/(auth)/phone')}
          accessibilityRole="button"
          accessibilityLabel="Change mobile number"
          hitSlop={10}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <ArrowLeft size={20} strokeWidth={2.3} color={colors.charcoal} />
        </Pressable>
        <BrandLockup size={34} />
        <View style={styles.backSpacer} />
      </View>

      <View style={styles.heading}>
        <AppText variant="caption" color={colors.orangeDark}>
          Step 2 of 2
        </AppText>
        <AppText variant="h1">Check your messages</AppText>
        <AppText variant="body" color={colors.muted}>
          We sent a six-digit code to your mobile. Enter it below to verify your
          number.
        </AppText>
      </View>

      <View style={styles.phoneCard}>
        <View style={styles.phoneIcon}>
          <ShieldCheck size={19} strokeWidth={2.1} color={colors.orangeDark} />
        </View>
        <View style={styles.phoneCopy}>
          <AppText variant="small" color={colors.muted}>
            Code sent to
          </AppText>
          <AppText variant="bodyStrong">{formatPhone(phone)}</AppText>
        </View>
        <Pressable
          onPress={() => router.replace('/(auth)/phone')}
          accessibilityRole="button"
          accessibilityLabel="Change mobile number"
          hitSlop={8}
        >
          <AppText variant="smallStrong" color={colors.orangeDark}>
            Change
          </AppText>
        </Pressable>
      </View>

      <OtpInput value={code} onChange={setCode} disabled={submitting} error={Boolean(error)} />

      {error ? <InlineMessage message={error} tone="error" /> : null}

      <Button
        label="Verify and continue"
        loadingLabel="Verifying…"
        loading={submitting}
        onPress={verify}
        disabled={code.length !== 6}
      />

      <Pressable
        onPress={resend}
        disabled={resendIn > 0 || resending}
        accessibilityRole="button"
        accessibilityState={{ disabled: resendIn > 0 || resending }}
        style={({ pressed }) => [styles.resend, pressed && styles.pressed]}
      >
        <AppText
          variant="smallStrong"
          color={resendIn > 0 ? colors.muted : colors.orangeDark}
        >
          {resendLabel}
        </AppText>
      </Pressable>

      <View style={styles.hint}>
        <AppText variant="small" color={colors.muted} style={styles.center}>
          The code expires in five minutes. If it does not arrive, check that
          the number is correct and request a new code.
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  backSpacer: {
    width: 40,
  },
  pressed: {
    opacity: 0.7,
  },
  heading: {
    gap: spacing.sm,
  },
  phoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
  phoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneCopy: {
    flex: 1,
    gap: 1,
  },
  resend: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
    maxWidth: 340,
  },
});
