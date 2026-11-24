import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Receipt, ShoppingBag } from 'lucide-react-native';
import { colors, spacing } from '@/constants/theme';
import { useSignedIn } from '@/hooks/useSignedIn';
import { apiGet } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';
import { orderStatusLabel, orderStatusTone } from '@/lib/order-status';
import type { OrderView, OrdersData } from '@/lib/types';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { FlowHeader } from '@/components/OrderChrome';
import { Screen } from '@/components/Screen';
import { ScreenSkeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';

function itemSummary(order: OrderView): string {
  if (order.items.length === 0) return 'No items';
  const first = order.items[0];
  const extra = order.items.length - 1;
  return extra > 0
    ? `${first.quantity} × ${first.name} + ${extra} more`
    : `${first.quantity} × ${first.name}`;
}

export default function OrdersScreen() {
  const router = useRouter();
  const signedIn = useSignedIn();
  const query = useQuery({
    queryKey: ['orders'],
    queryFn: ({ signal }) => apiGet<OrdersData>('/api/orders', signal),
    enabled: signedIn,
  });

  const orders = query.data?.orders ?? [];

  return (
    <Screen
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      contentContainerStyle={styles.content}
    >
      <FlowHeader title="Your orders" subtitle="Live status and past visits" />

      {query.isLoading ? (
        <ScreenSkeleton blocks={3} />
      ) : query.isError ? (
        <ErrorState
          title="Orders are not loading"
          message="Check your connection and pull down to try again."
          onRetry={() => query.refetch()}
        />
      ) : orders.length === 0 ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title="No orders yet"
            body="When you place an order it will appear here with live kitchen updates."
            actionLabel="Browse the menu"
            onAction={() => router.push('/order')}
          />
        </Card>
      ) : (
        <View style={styles.stack}>
          {orders.map((order) => (
            <Pressable
              key={order.id}
              onPress={() =>
                router.push({
                  pathname: '/orders/[id]',
                  params: { id: String(order.id) },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Open order ${order.orderNumber}`}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Card style={styles.card}>
                <View style={styles.topRow}>
                  <View style={styles.numberWrap}>
                    <AppText variant="smallStrong">{order.orderNumber}</AppText>
                    <AppText variant="small" color={colors.muted}>
                      {formatDateTime(order.placedAt)}
                    </AppText>
                  </View>
                  <Badge
                    label={orderStatusLabel(order.status)}
                    tone={orderStatusTone(order.status)}
                  />
                </View>
                <View style={styles.midRow}>
                  <View style={styles.iconWrap}>
                    <ShoppingBag size={17} strokeWidth={2.1} color={colors.orangeDark} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="small" color={colors.body}>
                      {itemSummary(order)}
                    </AppText>
                    <AppText variant="small" color={colors.muted}>
                      {order.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'} ·{' '}
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </AppText>
                  </View>
                  <AppText variant="smallStrong">{formatMoney(order.totalPaise)}</AppText>
                  <ChevronRight size={17} strokeWidth={2.3} color={colors.muted} />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
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
  card: {
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  numberWrap: {
    flex: 1,
    gap: 2,
  },
  midRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
