import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Phone,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';
import { authErrorMessage } from '@/lib/auth-errors';
import { AppText } from '@/components/AppText';
import { BrandLockup } from '@/components/Logo';
import { Button } from '@/components/Button';
import { InlineMessage } from '@/components/InlineMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/ToastProvider';

type Country = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
  exact?: number;
};

const countries: Country[] = [
  { iso: 'IN', name: 'India', dial: '+91', flag: '\u{1F1EE}\u{1F1F3}', exact: 10 },
  { iso: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '\u{1F1E6}\u{1F1EA}' },
  { iso: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '\u{1F1F8}\u{1F1E6}' },
  { iso: 'QA', name: 'Qatar', dial: '+974', flag: '\u{1F1F6}\u{1F1E6}' },
  { iso: 'OM', name: 'Oman', dial: '+968', flag: '\u{1F1F4}\u{1F1F2}' },
  { iso: 'KW', name: 'Kuwait', dial: '+965', flag: '\u{1F1F0}\u{1F1FC}' },
  { iso: 'BH', name: 'Bahrain', dial: '+973', flag: '\u{1F1E7}\u{1F1ED}' },
  { iso: 'US', name: 'United States', dial: '+1', flag: '\u{1F1FA}\u{1F1F8}' },
  { iso: 'GB', name: 'United Kingdom', dial: '+44', flag: '\u{1F1EC}\u{1F1E7}' },
  { iso: 'SG', name: 'Singapore', dial: '+65', flag: '\u{1F1F8}\u{1F1EC}' },
  { iso: 'MY', name: 'Malaysia', dial: '+60', flag: '\u{1F1F2}\u{1F1FE}' },
  { iso: 'AU', name: 'Australia', dial: '+61', flag: '\u{1F1E6}\u{1F1FA}' },
];

export default function PhoneScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [country, setCountry] = useState<Country>(countries[0]);
  const [national, setNational] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/welcome');
    }
  };

  const cleanNumber = (text: string) => {
    const dialDigits = country.dial.replace('+', '');
    let digits = text.replace(/\D/g, '');
    if (digits.startsWith(dialDigits) && digits.length > (country.exact ?? 8)) {
      digits = digits.slice(dialDigits.length);
    }
    return digits.replace(/^0+/, '').slice(0, 15);
  };

  const submit = async () => {
    if (sending) return;
    const digits = national.replace(/\D/g, '');

    if (country.exact) {
      if (digits.length !== country.exact) {
        setError(`Enter the ${country.exact}-digit mobile number.`);
        return;
      }
    } else if (digits.length < 6 || digits.length > 14) {
      setError('Enter a valid mobile number for this country.');
      return;
    }

    const phoneNumber = `${country.dial}${digits}`;
    setError(null);
    setSending(true);

    try {
      const { error: sendError } = await authClient.phoneNumber.sendOtp({
        phoneNumber,
      });

      if (sendError) {
        const message = authErrorMessage(
          sendError,
          'We could not send your code. Please try again.',
        );
        setError(message);
        showToast(message, 'error');
        return;
      }

      showToast('Code sent. Check your messages.', 'success');
      router.push({ pathname: '/(auth)/verify', params: { phone: phoneNumber } });
    } catch {
      const message = 'Check your connection and try again.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
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
          Step 1 of 2
        </AppText>
        <AppText variant="h1">What’s your number?</AppText>
        <AppText variant="body" color={colors.muted}>
          We send a real six-digit SMS code to confirm it’s you. No passwords,
          no fake codes.
        </AppText>
      </View>

      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <AppText variant="label">Country</AppText>
          <Pressable
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Country code ${country.dial}. Tap to change.`}
            style={({ pressed }) => [styles.countryButton, pressed && styles.pressed]}
          >
            <AppText style={styles.flag}>{country.flag}</AppText>
            <View style={styles.countryCopy}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {country.name}
              </AppText>
              <AppText variant="small" color={colors.muted}>
                {country.dial}
              </AppText>
            </View>
            <ChevronDown size={18} strokeWidth={2.2} color={colors.muted} />
          </Pressable>
        </View>

        <TextField
          label="Mobile number"
          icon={Phone}
          value={national}
          onChangeText={(text) => {
            setNational(cleanNumber(text));
            if (error) setError(null);
          }}
          placeholder={country.iso === 'IN' ? '98765 43210' : 'Mobile number'}
          keyboardType="phone-pad"
          inputMode="tel"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={15}
          returnKeyType="done"
          onSubmitEditing={submit}
          error={error}
        />

        {error ? <InlineMessage message={error} tone="error" /> : null}

        <Button
          label="Send my code"
          loadingLabel="Sending code…"
          loading={sending}
          onPress={submit}
          disabled={national.length === 0}
        />

        <View style={styles.assurance}>
          <ShieldCheck size={17} strokeWidth={2.1} color={colors.success} />
          <AppText variant="small" color={colors.muted} style={styles.assuranceText}>
            Your verified number stays private. It is only used for your account
            and club updates.
          </AppText>
        </View>
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            accessibilityRole="button"
            accessibilityLabel="Close country picker"
            onPress={() => setPickerOpen(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <AppText variant="h2">Country code</AppText>
              <AppText variant="small" color={colors.muted}>
                Choose where your number is registered.
              </AppText>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.countryList}
              keyboardShouldPersistTaps="handled"
            >
              {countries.map((item) => {
                const selected = item.iso === country.iso;
                return (
                  <Pressable
                    key={item.iso}
                    onPress={() => {
                      setCountry(item);
                      setNational('');
                      setError(null);
                      setPickerOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.countryRow,
                      selected && styles.countryRowSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText style={styles.flag}>{item.flag}</AppText>
                    <AppText variant="bodyStrong" style={styles.countryName}>
                      {item.name}
                    </AppText>
                    <AppText variant="small" color={colors.muted}>
                      {item.dial}
                    </AppText>
                    {selected ? (
                      <Check size={18} strokeWidth={2.6} color={colors.orangeDark} />
                    ) : (
                      <View style={styles.checkSpacer} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
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
    opacity: 0.72,
  },
  heading: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  countryButton: {
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 22,
    lineHeight: 28,
  },
  countryCopy: {
    flex: 1,
    gap: 1,
  },
  assurance: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BEE3CF',
    padding: spacing.md,
  },
  assuranceText: {
    flex: 1,
    lineHeight: 18,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    maxHeight: '78%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lineStrong,
    marginBottom: spacing.lg,
  },
  sheetHeader: {
    gap: 2,
    marginBottom: spacing.md,
  },
  countryList: {
    flexGrow: 0,
  },
  countryRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  countryRowSelected: {
    backgroundColor: colors.white,
    borderColor: colors.line,
  },
  countryName: {
    flex: 1,
  },
  checkSpacer: {
    width: 18,
  },
});
