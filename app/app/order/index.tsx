import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Bike,
  Minus,
  Plus,
  ShoppingBag,
  UtensilsCrossed,
} from 'lucide-react-native';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useSignedIn } from '@/hooks/useSignedIn';
import { apiGet } from '@/lib/api';
import { useCart, type CartLine } from '@/lib/cart';
import { formatMoney } from '@/lib/format';
import type { MenuData, MenuItemView } from '@/lib/types';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { BurgerImage } from '@/components/BurgerImage';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { InlineMessage } from '@/components/InlineMessage';
import { CartButton, FlowHeader } from '@/components/OrderChrome';
import { Screen } from '@/components/Screen';
import { ScreenSkeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';

function DietMark({ isVeg }: { isVeg: boolean }) {
  const color = isVeg ? colors.success : colors.danger;
  return (
    <View style={[styles.diet, { borderColor: color }]}>
      <View style={[styles.dietDot, { backgroundColor: color }]} />
    </View>
  );
}

function MenuItemCard({
  item,
  orderingEnabled,
}: {
  item: MenuItemView;
  orderingEnabled: boolean;
}) {
  const { add, increment, decrement, quantityFor } = useCart();
  const quantity = quantityFor(item.id);
  const addable = orderingEnabled && item.available;

  const line: Omit<CartLine, 'quantity'> = {
    menuItemId: item.id,
    name: item.name,
    pricePaise: item.pricePaise,
    imageUrl: item.imageUrl,
    isVeg: item.isVeg,
  };

  return (
    <Card style={styles.itemCard}>
      <View style={styles.itemRow}>
        <View style={styles.imageWrap}>
          <BurgerImage
            uri={item.imageUrl}
            height={92}
            borderRadius={radius.md}
            style={styles.itemImage}
            accessibilityLabel={item.name}
          />
        </View>
        <View style={styles.itemCopy}>
          <View style={styles.itemTitleRow}>
            <DietMark isVeg={item.isVeg} />
            <AppText variant="smallStrong" style={styles.flex} numberOfLines={2}>
              {item.name}
            </AppText>
            {!item.available ? <Badge label="Sold out" tone="muted" /> : null}
          </View>
          {item.description ? (
            <AppText variant="small" color={colors.muted} numberOfLines={2}>
              {item.description}
            </AppText>
          ) : null}
          <View style={styles.itemFoot}>
            <AppText variant="smallStrong" color={colors.charcoal}>
              {formatMoney(item.pricePaise)}
            </AppText>
            {quantity === 0 ? (
              <Button
                label={addable ? 'Add' : 'Sold out'}
                icon={addable ? Plus : undefined}
                size="sm"
                fullWidth={false}
                disabled={!addable}
                onPress={() => add(line)}
                accessibilityHint={`Add ${item.name} to your cart`}
              />
            ) : (
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => decrement(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove one ${item.name}`}
                  hitSlop={6}
                  style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
                >
                  <Minus size={16} strokeWidth={2.5} color={colors.charcoal} />
                </Pressable>
                <AppText style={styles.stepValue}>{quantity}</AppText>
                <Pressable
                  onPress={() => increment(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add one more ${item.name}`}
                  hitSlop={6}
                  style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
                >
                  <Plus size={16} strokeWidth={2.5} color={colors.charcoal} />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const signedIn = useSignedIn();
  const { itemCount, subtotalPaise, sync } = useCart();
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');

  const query = useQuery({
    queryKey: ['menu'],
    queryFn: ({ signal }) => apiGet<MenuData>('/api/menu', signal),
  });

  const data = query.data;
  const categories = useMemo(() => data?.categories ?? [], [data]);
  const allItems = useMemo(
    () => categories.flatMap((category) => category.items),
    [categories],
  );
  const visibleCategories = useMemo(() => {
    if (activeCategory === 'all') return categories;
    const matched = categories.filter((category) => category.id === activeCategory);
    return matched.length > 0 ? matched : categories;
  }, [categories, activeCategory]);

  useEffect(() => {
    if (allItems.length > 0) sync(allItems);
  }, [allItems, sync]);

  const enabled = data?.ordering.enabled ?? false;

  return (
    <View style={styles.root}>
      <Screen
        refreshing={query.isRefetching}
        onRefresh={() => query.refetch()}
        contentContainerStyle={styles.content}
      >
        <FlowHeader
          title="Order"
          subtitle={data?.ordering.venue ? `Fresh from ${data.ordering.venue}` : 'Pickup and delivery'}
          right={<CartButton />}
        />

        {query.isLoading ? (
          <ScreenSkeleton blocks={4} />
        ) : query.isError || !data ? (
          <ErrorState
            title="The menu is not loading"
            message="Check your connection and pull down to try again."
            onRetry={() => query.refetch()}
          />
        ) : (
          <>
            <Card tone="charcoal" style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={styles.flex}>
                  <AppText variant="caption" color="#C9BBA9">
                    The club kitchen
                  </AppText>
                  <AppText variant="h2" color={colors.white}>
                    Order your favourites
                  </AppText>
                </View>
                <Badge label={enabled ? 'Open' : 'Paused'} tone={enabled ? 'green' : 'muted'} />
              </View>
              <AppText variant="small" color="#C9BBA9">
                {data.ordering.note ??
                  'Pickup or delivery from the club. Prices include everything except the delivery fee.'}
              </AppText>
              <View style={styles.heroMeta}>
                <View style={styles.metaItem}>
                  <Bike size={15} strokeWidth={2.2} color={colors.orange} />
                  <AppText variant="small" color="#E7D9C7">
                    Delivery {formatMoney(data.ordering.deliveryFeePaise)}
                  </AppText>
                </View>
                <View style={styles.metaItem}>
                  <ShoppingBag size={15} strokeWidth={2.2} color={colors.orange} />
                  <AppText variant="small" color="#E7D9C7">
                    Min {formatMoney(data.ordering.minOrderPaise)}
                  </AppText>
                </View>
              </View>
            </Card>

            {!enabled ? (
              <InlineMessage
                tone="info"
                message="Ordering is paused right now. You can browse the menu and the club will reopen ordering soon."
              />
            ) : null}

            {categories.length === 0 ? (
              <Card>
                <EmptyState
                  icon={UtensilsCrossed}
                  title="The menu is being plated"
                  body="The club has not published any dishes yet. Pull down to check again."
                  actionLabel="Refresh"
                  onAction={() => query.refetch()}
                />
              </Card>
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}
                >
                  <Pressable
                    onPress={() => setActiveCategory('all')}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activeCategory === 'all' }}
                    style={({ pressed }) => [
                      styles.chip,
                      activeCategory === 'all' && styles.chipActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText
                      variant="smallStrong"
                      color={activeCategory === 'all' ? colors.white : colors.body}
                    >
                      All
                    </AppText>
                  </Pressable>
                  {categories.map((category) => {
                    const active = activeCategory === category.id;
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => setActiveCategory(category.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        style={({ pressed }) => [
                          styles.chip,
                          active && styles.chipActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <AppText
                          variant="smallStrong"
                          color={active ? colors.white : colors.body}
                        >
                          {category.name}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {visibleCategories.map((category) => (
                  <View key={category.id} style={styles.section}>
                    <View style={styles.sectionHead}>
                      <AppText variant="h2">{category.name}</AppText>
                      <AppText variant="small" color={colors.muted}>
                        {category.items.length}{' '}
                        {category.items.length === 1 ? 'item' : 'items'}
                      </AppText>
                    </View>
                    <View style={styles.stack}>
                      {category.items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          orderingEnabled={enabled}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </>
            )}

            <Pressable
              onPress={() => router.push(signedIn ? '/orders' : '/(auth)/phone')}
              accessibilityRole="button"
              accessibilityLabel={
                signedIn ? 'View your order history' : 'Sign in to see your past orders'
              }
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Card tone="cream" style={styles.historyCard}>
                <View style={styles.flex}>
                  <AppText variant="smallStrong">
                    {signedIn ? 'Your past orders' : 'Want to track your order?'}
                  </AppText>
                  <AppText variant="small" color={colors.muted}>
                    {signedIn
                      ? 'Track live orders and revisit what you loved.'
                      : 'Sign in with your mobile number to save and track orders.'}
                  </AppText>
                </View>
                <ArrowRight size={18} strokeWidth={2.3} color={colors.orangeDark} />
              </Card>
            </Pressable>
          </>
        )}
      </Screen>

      {itemCount > 0 ? (
        <View
          style={[styles.cartBarWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => router.push('/order/cart')}
            accessibilityRole="button"
            accessibilityLabel={`View cart, ${itemCount} items, ${formatMoney(subtotalPaise)}`}
            style={({ pressed }) => [styles.cartBar, pressed && styles.pressed]}
          >
            <View style={styles.cartBarCount}>
              <AppText style={styles.cartBarCountText}>{itemCount}</AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="smallStrong" color={colors.white}>
                View your cart
              </AppText>
              <AppText variant="small" color="#C9BBA9">
                {formatMoney(subtotalPaise)}
              </AppText>
            </View>
            <ArrowRight size={19} strokeWidth={2.4} color={colors.orange} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
  heroCard: {
    gap: spacing.sm,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chips: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.charcoal,
    borderColor: colors.charcoal,
  },
  section: {
    gap: spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.md,
  },
  itemCard: {
    padding: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  imageWrap: {
    width: 92,
  },
  itemImage: {
    width: 92,
  },
  itemCopy: {
    flex: 1,
    gap: 5,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  itemFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 2,
  },
  diet: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    minWidth: 24,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.charcoal,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
  cartBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.charcoal,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    ...shadow.floating,
  },
  cartBarCount: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBarCountText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.white,
  },
});
