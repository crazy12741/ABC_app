import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Bike,
  CheckCircle2,
  ShoppingBag,
  Smartphone,
  Store,
} from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { useSignedIn } from '@/hooks/useSignedIn';
import { apiGet, apiPost } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { formatMoney } from '@/lib/format';
import type { MenuData, OrderView, ProfileData } from '@/lib/types';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { InlineMessage } from '@/components/InlineMessage';
import { FlowHeader } from '@/components/OrderChrome';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/ToastProvider';

type Fulfilment = 'pickup' | 'delivery';
type Payment = 'cash' | 'upi';

function OptionRow({
  selected,
  onPress,
  title,
  body,
  icon: Icon,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  body: string;
  icon: typeof Store;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
        <Icon
          size={18}
          strokeWidth={2.1}
          color={selected ? colors.charcoal : colors.orangeDark}
        />
      </View>
      <View style={styles.flex}>
        <AppText variant="smallStrong">{title}</AppText>
        <AppText variant="small" color={colors.muted}>
          {body}
        </AppText>
      </View>
      {selected ? (
        <CheckCircle2 size={19} strokeWidth={2.3} color={colors.success} />
      ) : (
        <View style={styles.radio} />
      )}
    </Pressable>
  );
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const signedIn = useSignedIn();
  const { lines, itemCount, subtotalPaise, clear, hydrated, sync } = useCart();

  const menuQuery = useQuery({
    queryKey: ['menu'],
    queryFn: ({ signal }) => apiGet<MenuData>('/api/menu', signal),
    enabled: signedIn,
  });

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: ({ signal }) => apiGet<ProfileData>('/api/profile', signal),
    enabled: signedIn,
  });

  const [fulfilment, setFulfilment] = useState<Fulfilment>('pickup');
  const [payment, setPayment] = useState<Payment>('cash');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const menuItems = useMemo(
    () => menuQuery.data?.categories.flatMap((category) => category.items) ?? [],
    [menuQuery.data],
  );

  useEffect(() => {
    if (menuItems.length > 0) sync(menuItems);
  }, [menuItems, sync]);

  const profile = profileQuery.data?.profile;
  useEffect(() => {
    if (!phoneTouched && profile?.phoneNumber) {
      setPhone(profile.phoneNumber);
    }
  }, [profile?.phoneNumber, phoneTouched]);

  const ordering = menuQuery.data?.ordering;
  const enabled = ordering?.enabled ?? false;
  const deliveryFee = fulfilment === 'delivery' ? ordering?.deliveryFeePaise ?? 0 : 0;
  const total = subtotalPaise + deliveryFee;
  const minOrder = ordering?.minOrderPaise ?? 0;
  const belowMinimum =
    fulfilment === 'delivery' && subtotalPaise < minOrder && minOrder > 0;

  const validate = (): string | null => {
    if (lines.length === 0) return 'Your cart is empty. Add something from the menu first.';
    if (!enabled) return 'Ordering is paused right now. Please try again later.';
    if (phone.replace(/\D/g, '').length < 10) {
      return 'Add a full contact number so the club can reach you.';
    }
    if (fulfilment === 'delivery' && address.trim().length < 10) {
      return 'Add a delivery address with enough detail for the rider.';
    }
    if (belowMinimum) {
      return `Delivery orders need a minimum of ${formatMoney(minOrder)}.`;
    }
    return null;
  };

  const placeOrder = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      showToast(problem, 'error');
      return;
    }

    setError(null);
    setPlacing(true);
    try {
      const result = await apiPost<{ order: OrderView }>('/api/orders', {
        fulfilment,
        paymentMethod: payment,
        phone: phone.trim(),
        address: fulfilment === 'delivery' ? address.trim() : null,
        notes: notes.trim().length > 0 ? notes.trim() : null,
        items: lines.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
        })),
      });

      clear();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });

      showToast('Order placed. The kitchen has it.', 'success');
      router.replace({
        pathname: '/orders/[id]',
        params: { id: String(result.order.id), placed: '1' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'The order could not be placed.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setPlacing(false);
    }
  };

  if (!hydrated) {
    return (
      <Screen>
        <FlowHeader title="Checkout" />
      </Screen>
    );
  }

  if (!signedIn) {
    return (
      <Screen contentContainerStyle={styles.content}>
        <FlowHeader title="Checkout" />
        <Card>
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <ShoppingBag size={22} strokeWidth={2} color={colors.orangeDark} />
            </View>
            <AppText variant="h3">Sign in to place your order</AppText>
            <AppText variant="small" color={colors.muted} style={styles.center}>
              Your cart is saved. Verify your mobile number to confirm the order and
              track it live.
            </AppText>
            <Button
              label="Sign in with mobile"
              onPress={() => router.replace('/(auth)/phone')}
              style={styles.emptyButton}
            />
            <Button
              label="Back to the menu"
              variant="secondary"
              onPress={() => router.replace('/order')}
            />
          </View>
        </Card>
      </Screen>
    );
  }

  if (lines.length === 0) {
    return (
      <Screen contentContainerStyle={styles.content}>
        <FlowHeader title="Checkout" />
        <Card>
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <ShoppingBag size={22} strokeWidth={2} color={colors.orangeDark} />
            </View>
            <AppText variant="h3">Nothing to check out</AppText>
            <AppText variant="small" color={colors.muted} style={styles.center}>
              Your cart is empty. Add a burger or a side and come back.
            </AppText>
            <Button
              label="Browse the menu"
              onPress={() => router.replace('/order')}
              style={styles.emptyButton}
            />
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <FlowHeader title="Checkout" subtitle={`${itemCount} ${itemCount === 1 ? 'item' : 'items'}`} />

      {menuQuery.isLoading || profileQuery.isLoading ? (
        <InlineMessage message="Loading delivery options…" tone="info" />
      ) : null}

      {!enabled && !menuQuery.isLoading ? (
        <InlineMessage
          tone="info"
          message="Ordering is paused right now. You can keep your cart and try again when the club reopens orders."
        />
      ) : null}

      <Card style={styles.section}>
        <AppText variant="h3">How would you like it?</AppText>
        <View style={styles.optionStack}>
          <OptionRow
            selected={fulfilment === 'pickup'}
            onPress={() => {
              setFulfilment('pickup');
              setError(null);
            }}
            title="Pickup"
            body="Collect at the club counter. No delivery fee."
            icon={Store}
          />
          <OptionRow
            selected={fulfilment === 'delivery'}
            onPress={() => {
              setFulfilment('delivery');
              setError(null);
            }}
            title="Delivery"
            body={`Kochi delivery · ${formatMoney(ordering?.deliveryFeePaise ?? 0)} · min ${formatMoney(minOrder)}`}
            icon={Bike}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <AppText variant="h3">Contact</AppText>
        <TextField
          label="Phone for this order"
          value={phone}
          onChangeText={(value) => {
            setPhone(value);
            setPhoneTouched(true);
            if (error) setError(null);
          }}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          maxLength={20}
          icon={Smartphone}
        />
        <TextField
          label="Notes for the kitchen"
          hint="Optional"
          value={notes}
          onChangeText={setNotes}
          placeholder="No onions, extra sauce, ring the bell…"
          multiline
          maxLength={500}
          inputStyle={styles.notesInput}
        />
      </Card>

      {fulfilment === 'delivery' ? (
        <Card style={styles.section}>
          <AppText variant="h3">Delivery address</AppText>
          <TextField
            label="Where should the rider go?"
            value={address}
            onChangeText={(value) => {
              setAddress(value);
              if (error) setError(null);
            }}
            placeholder="Flat, building, street, area, landmark"
            multiline
            maxLength={500}
            inputStyle={styles.addressInput}
          />
        </Card>
      ) : null}

      <Card style={styles.section}>
        <AppText variant="h3">Payment</AppText>
        <View style={styles.optionStack}>
          <OptionRow
            selected={payment === 'cash'}
            onPress={() => setPayment('cash')}
            title="Cash on delivery"
            body="Pay the rider or counter when you receive the order."
            icon={Banknote}
          />
          <OptionRow
            selected={payment === 'upi'}
            onPress={() => setPayment('upi')}
            title="UPI on delivery"
            body="Scan and pay the club's UPI QR at handover."
            icon={Smartphone}
          />
        </View>
      </Card>

      <Card tone="charcoal" style={styles.summary}>
        <AppText variant="caption" color="#C9BBA9">
          Order summary
        </AppText>
        <View style={styles.summaryLines}>
          {lines.map((line) => (
            <View key={line.menuItemId} style={styles.summaryRow}>
              <AppText variant="small" color="#E7D9C7" style={styles.flex}>
                {line.quantity} × {line.name}
              </AppText>
              <AppText variant="small" color={colors.white}>
                {formatMoney(line.pricePaise * line.quantity)}
              </AppText>
            </View>
          ))}
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <AppText variant="small" color="#C9BBA9">
            Items
          </AppText>
          <AppText variant="small" color={colors.white}>
            {formatMoney(subtotalPaise)}
          </AppText>
        </View>
        <View style={styles.summaryRow}>
          <AppText variant="small" color="#C9BBA9">
            Delivery
          </AppText>
          <AppText variant="small" color={colors.white}>
            {deliveryFee > 0 ? formatMoney(deliveryFee) : 'Free'}
          </AppText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <AppText variant="h3" color={colors.white}>
            Total
          </AppText>
          <AppText variant="h3" color={colors.white}>
            {formatMoney(total)}
          </AppText>
        </View>
        {belowMinimum ? (
          <AppText variant="small" color="#FFB27D">
            Add {formatMoney(minOrder - subtotalPaise)} more for delivery, or switch
            to pickup.
          </AppText>
        ) : null}
      </Card>

      {error ? <InlineMessage message={error} tone="error" /> : null}

      <Button
        label={placing ? 'Placing order…' : `Place order · ${formatMoney(total)}`}
        loading={placing}
        loadingLabel="Placing order…"
        onPress={placeOrder}
        disabled={!enabled}
      />
      <AppText variant="small" color={colors.muted} style={styles.footnote}>
        You will get live status updates in the app and can follow the order from
        Your orders. Payment is collected on delivery.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  optionStack: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    padding: spacing.md,
  },
  optionSelected: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeSoft,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
  },
  pressed: {
    opacity: 0.8,
  },
  notesInput: {
    minHeight: 84,
  },
  addressInput: {
    minHeight: 96,
  },
  summary: {
    gap: spacing.sm,
  },
  summaryLines: {
    gap: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginVertical: 2,
  },
  footnote: {
    textAlign: 'center',
    lineHeight: 18,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
    maxWidth: 300,
  },
  emptyButton: {
    marginTop: 8,
  },
});
