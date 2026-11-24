import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, MapPin, ShoppingBag } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { apiGet, apiPut } from '@/lib/api';
import {
  combineDateTime,
  paiseToRupees,
  parseRupeesValue,
  splitDateTime,
} from '@/lib/format';
import type { SettingsView } from '@/lib/types';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Countdown } from '@/components/Countdown';
import { ErrorState } from '@/components/StateViews';
import { InlineMessage } from '@/components/InlineMessage';
import { ScreenSkeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/ToastProvider';

export default function AdminSettingsScreen() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: ({ signal }) =>
      apiGet<{ settings: SettingsView | null }>('/api/admin/settings', signal),
  });

  const [openingDate, setOpeningDate] = useState('');
  const [openingTime, setOpeningTime] = useState('18:00');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [mysteryTitle, setMysteryTitle] = useState('');
  const [mysteryTagline, setMysteryTagline] = useState('');
  const [mysteryImageUrl, setMysteryImageUrl] = useState('');
  const [referralReward, setReferralReward] = useState('');
  const [referralRules, setReferralRules] = useState('');
  const [orderingEnabled, setOrderingEnabled] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState('39');
  const [minOrder, setMinOrder] = useState('199');
  const [orderingNote, setOrderingNote] = useState('');
  const [initialised, setInitialised] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!query.data) return;
    const settings = query.data.settings;
    const parts = splitDateTime(settings?.openingAt ?? null);
    setOpeningDate(parts.date);
    setOpeningTime(parts.time || '18:00');
    setVenue(settings?.venue ?? '');
    setCity(settings?.city ?? '');
    setMysteryTitle(settings?.mysteryTitle ?? '');
    setMysteryTagline(settings?.mysteryTagline ?? '');
    setMysteryImageUrl(settings?.mysteryImageUrl ?? '');
    setReferralReward(settings?.referralReward ?? '');
    setReferralRules(settings?.referralRules ?? '');
    setOrderingEnabled(settings?.orderingEnabled ?? true);
    setDeliveryFee(paiseToRupees(settings?.deliveryFeePaise ?? 3900));
    setMinOrder(paiseToRupees(settings?.minOrderPaise ?? 19900));
    setOrderingNote(settings?.orderingNote ?? '');
    setInitialised(true);
  }, [query.data]);

  const save = async () => {
    let openingAt: string | null = null;
    if (openingDate.trim().length > 0 || openingTime.trim().length > 0) {
      openingAt = combineDateTime(openingDate.trim(), openingTime.trim());
      if (!openingAt) {
        setError('Enter a valid opening date and time, or leave both blank.');
        return;
      }
    }

    const deliveryFeePaise = parseRupeesValue(deliveryFee.trim());
    if (deliveryFeePaise === null) {
      setError('Enter a valid delivery fee in rupees. Use 0 for free delivery.');
      return;
    }
    const minOrderPaise = parseRupeesValue(minOrder.trim());
    if (minOrderPaise === null) {
      setError('Enter a valid minimum order value in rupees.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await apiPut('/api/admin/settings', {
        openingAt,
        venue: venue.trim(),
        city: city.trim(),
        mysteryTitle: mysteryTitle.trim(),
        mysteryTagline: mysteryTagline.trim(),
        mysteryImageUrl: mysteryImageUrl.trim(),
        referralReward: referralReward.trim(),
        referralRules: referralRules.trim(),
        orderingEnabled,
        deliveryFeePaise,
        minOrderPaise,
        orderingNote: orderingNote.trim(),
      });
      showToast('Club settings saved. Customers see the changes now.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['mystery'] });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'menu'] });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'The settings could not be saved.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const previewTarget =
    openingDate.trim().length > 0
      ? combineDateTime(openingDate.trim(), openingTime.trim())
      : null;

  return (
    <AdminScreen
      title="Club settings"
      subtitle="Opening date, venue, mystery and rewards"
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      {query.isLoading || !initialised ? (
        <ScreenSkeleton blocks={4} />
      ) : query.isError ? (
        <ErrorState
          title="Settings unavailable"
          message="Check your connection and try again."
          onRetry={() => query.refetch()}
        />
      ) : (
        <View style={styles.content}>
          <Card tone="charcoal" style={styles.preview}>
            <AppText variant="caption" color="#C9BBA9">
              Countdown preview
            </AppText>
            <Countdown target={previewTarget} variant="dark" />
            {previewTarget ? (
              <View style={styles.previewRow}>
                <MapPin size={15} strokeWidth={2.2} color={colors.orange} />
                <AppText variant="small" color="#C9BBA9">
                  {[venue.trim(), city.trim()].filter(Boolean).join(', ') ||
                    'Add a venue below'}
                </AppText>
              </View>
            ) : (
              <AppText variant="small" color="#C9BBA9">
                No opening date set. Customers see “Opening date to be announced”.
              </AppText>
            )}
          </Card>

          <Card style={styles.section}>
            <View style={styles.sectionHeading}>
              <CalendarDays size={18} strokeWidth={2.1} color={colors.orangeDark} />
              <AppText variant="h3">Opening</AppText>
            </View>
            <View style={styles.row}>
              <TextField
                label="Date"
                hint="YYYY-MM-DD"
                value={openingDate}
                onChangeText={setOpeningDate}
                placeholder="2026-12-20"
                autoCapitalize="none"
                maxLength={10}
                containerStyle={styles.flex}
              />
              <TextField
                label="Time"
                hint="24h"
                value={openingTime}
                onChangeText={setOpeningTime}
                placeholder="18:00"
                maxLength={5}
                containerStyle={styles.flex}
              />
            </View>
            <TextField
              label="Venue"
              value={venue}
              onChangeText={setVenue}
              placeholder="Marine Drive"
              maxLength={160}
            />
            <TextField
              label="City"
              value={city}
              onChangeText={setCity}
              placeholder="Kochi"
              maxLength={120}
            />
          </Card>

          <Card style={styles.section}>
            <AppText variant="h3">Mystery</AppText>
            <AppText variant="small" color={colors.muted}>
              These appear as the header of the Mystery tab.
            </AppText>
            <TextField
              label="Title"
              value={mysteryTitle}
              onChangeText={setMysteryTitle}
              placeholder="Something is coming"
              maxLength={160}
            />
            <TextField
              label="Tagline"
              value={mysteryTagline}
              onChangeText={setMysteryTagline}
              placeholder="A new taste is taking shape…"
              multiline
              maxLength={300}
              inputStyle={styles.taglineInput}
            />
            <TextField
              label="Hero image URL"
              hint="Optional"
              value={mysteryImageUrl}
              onChangeText={setMysteryImageUrl}
              placeholder="https://…"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              maxLength={500}
            />
          </Card>

          <Card style={styles.section}>
            <View style={styles.sectionHeading}>
              <ShoppingBag size={18} strokeWidth={2.1} color={colors.orangeDark} />
              <AppText variant="h3">Online ordering</AppText>
            </View>
            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <AppText variant="smallStrong">Accept orders</AppText>
                <AppText variant="small" color={colors.muted}>
                  Turn off to pause checkout while keeping the menu visible.
                </AppText>
              </View>
              <Switch
                value={orderingEnabled}
                onValueChange={setOrderingEnabled}
                trackColor={{ false: colors.lineStrong, true: colors.orange }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.lineStrong}
                accessibilityLabel="Accept orders"
              />
            </View>
            <View style={styles.row}>
              <TextField
                label="Delivery fee"
                hint="₹"
                value={deliveryFee}
                onChangeText={setDeliveryFee}
                placeholder="39"
                keyboardType="decimal-pad"
                maxLength={8}
                containerStyle={styles.flex}
              />
              <TextField
                label="Minimum delivery order"
                hint="₹"
                value={minOrder}
                onChangeText={setMinOrder}
                placeholder="199"
                keyboardType="decimal-pad"
                maxLength={8}
                containerStyle={styles.flex}
              />
            </View>
            <TextField
              label="Ordering note"
              hint="Shown on the menu"
              value={orderingNote}
              onChangeText={setOrderingNote}
              placeholder="Pickup in about 20 minutes…"
              multiline
              maxLength={500}
              inputStyle={styles.taglineInput}
            />
          </Card>

          <Card style={styles.section}>
            <AppText variant="h3">Referral rewards</AppText>
            <TextField
              label="Reward"
              value={referralReward}
              onChangeText={setReferralReward}
              placeholder="A free burger after three verified friends"
              maxLength={300}
            />
            <TextField
              label="Rules"
              value={referralRules}
              onChangeText={setReferralRules}
              placeholder="Explain how the club reviews and pays rewards…"
              multiline
              maxLength={1500}
              inputStyle={styles.rulesInput}
            />
          </Card>

          {error ? <InlineMessage message={error} tone="error" /> : null}

          <Button
            label="Save club settings"
            loadingLabel="Saving…"
            loading={saving}
            onPress={save}
          />
          <AppText variant="small" color={colors.muted} style={styles.footnote}>
            Changes are saved to the database and appear immediately for every
            customer.
          </AppText>
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
  preview: {
    gap: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  taglineInput: {
    minHeight: 84,
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
  rulesInput: {
    minHeight: 110,
  },
  footnote: {
    textAlign: 'center',
    lineHeight: 18,
  },
});
