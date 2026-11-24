import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { useCart } from '@/lib/cart';
import { confirmAction } from '@/lib/confirm';
import { formatMoney } from '@/lib/format';
import { AppText } from '@/components/AppText';
import { BurgerImage } from '@/components/BurgerImage';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FlowHeader } from '@/components/OrderChrome';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/StateViews';
import { useToast } from '@/components/ToastProvider';
import { useSignedIn } from '@/hooks/useSignedIn';

export default function CartScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const signedIn = useSignedIn();
  const { lines, itemCount, subtotalPaise, increment, decrement, remove, clear } =
    useCart();

  const confirmClear = () => {
    confirmAction(
      'Clear the cart?',
      'Every item will be removed. You can always add them back from the menu.',
      'Clear cart',
      () => {
        clear();
        showToast('Cart cleared.', 'success');
      },
    );
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <FlowHeader title="Your cart" subtitle={`${itemCount} ${itemCount === 1 ? 'item' : 'items'}`} />

      {lines.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            body="Add a burger or a side from the menu and it will wait for you here."
            actionLabel="Browse the menu"
            onAction={() => router.replace('/order')}
          />
        </Card>
      ) : (
        <>
          <View style={styles.stack}>
            {lines.map((line) => (
              <Card key={line.menuItemId} style={styles.lineCard}>
                <View style={styles.lineRow}>
                  <View style={styles.imageWrap}>
                    <BurgerImage
                      uri={line.imageUrl}
                      height={74}
                      borderRadius={radius.md}
                      style={styles.image}
                      accessibilityLabel={line.name}
                    />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="smallStrong" numberOfLines={2}>
                      {line.name}
                    </AppText>
                    <AppText variant="small" color={colors.muted}>
                      {formatMoney(line.pricePaise)} each
                    </AppText>
                    <View style={styles.lineFoot}>
                      <View style={styles.stepper}>
                        <Pressable
                          onPress={() => decrement(line.menuItemId)}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove one ${line.name}`}
                          hitSlop={6}
                          style={({ pressed }) => [
                            styles.stepButton,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Minus size={15} strokeWidth={2.5} color={colors.charcoal} />
                        </Pressable>
                        <AppText style={styles.stepValue}>{line.quantity}</AppText>
                        <Pressable
                          onPress={() => increment(line.menuItemId)}
                          accessibilityRole="button"
                          accessibilityLabel={`Add one more ${line.name}`}
                          hitSlop={6}
                          style={({ pressed }) => [
                            styles.stepButton,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Plus size={15} strokeWidth={2.5} color={colors.charcoal} />
                        </Pressable>
                      </View>
                      <AppText variant="smallStrong">
                        {formatMoney(line.pricePaise * line.quantity)}
                      </AppText>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => remove(line.menuItemId)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${line.name} from the cart`}
                    hitSlop={8}
                    style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
                  >
                    <Trash2 size={17} strokeWidth={2.1} color={colors.danger} />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>

          <Card tone="cream" style={styles.summary}>
            <View style={styles.summaryRow}>
              <AppText variant="small" color={colors.muted}>
                Items ({itemCount})
              </AppText>
              <AppText variant="smallStrong">{formatMoney(subtotalPaise)}</AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText variant="small" color={colors.muted}>
                Delivery
              </AppText>
              <AppText variant="small" color={colors.muted}>
                Calculated at checkout
              </AppText>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <AppText variant="h3">Item total</AppText>
              <AppText variant="h3">{formatMoney(subtotalPaise)}</AppText>
            </View>
            <AppText variant="small" color={colors.muted}>
              Taxes are included in menu prices. The delivery fee is added at
              checkout for delivery orders.
            </AppText>
          </Card>

          <Button
            label={signedIn ? 'Go to checkout' : 'Sign in to checkout'}
            icon={ArrowRight}
            onPress={() => router.push(signedIn ? '/order/checkout' : '/(auth)/phone')}
          />
          <Button
            label="Add more items"
            icon={UtensilsCrossed}
            variant="secondary"
            onPress={() => router.push('/order')}
          />
          <Button label="Clear cart" variant="ghost" icon={Trash2} onPress={confirmClear} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  stack: {
    gap: spacing.md,
  },
  lineCard: {
    padding: spacing.md,
  },
  lineRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  imageWrap: {
    width: 74,
  },
  image: {
    width: 74,
  },
  flex: {
    flex: 1,
    gap: 3,
  },
  lineFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.creamDeep,
    borderRadius: radius.pill,
    padding: 3,
  },
  stepButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    minWidth: 22,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.charcoal,
  },
  remove: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  summary: {
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 2,
  },
});
