import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ClipboardList } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { apiGet } from '@/lib/api';
import { formatDateTime, formatMoney, formatPhone } from '@/lib/format';
import {
  ORDER_STATUSES,
  orderStatusLabel,
  orderStatusTone,
} from '@/lib/order-status';
import type { AdminOrdersData, OrderView } from '@/lib/types';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { ScreenSkeleton } from '@/components/Skeleton';

type Filter = 'all' | (typeof ORDER_STATUSES)[number];

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'placed', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'On the grill' },
  { key: 'ready', label: 'Ready' },
  { key: 'out_for_delivery', label: 'On the way' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function itemSummary(order: OrderView): string {
  if (order.items.length === 0) return 'No items';
  return order.items
    .slice(0, 2)
    .map((item) => `${item.quantity} × ${item.name}`)
    .join(', ');
}

export default function AdminOrdersScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

  const query = useQuery({
    queryKey: ['admin', 'orders', filter],
    queryFn: ({ signal }) =>
      apiGet<AdminOrdersData>(
        `/api/admin/orders${filter === 'all' ? '' : `?status=${filter}`}`,
        signal,
      ),
  });

  const orders = query.data?.orders ?? [];

  return (
    <AdminScreen
      title="Orders"
      subtitle="Live kitchen queue"
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <View style={styles.content}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
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
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {query.isLoading ? (
          <ScreenSkeleton blocks={3} />
        ) : query.isError ? (
          <ErrorState
            title="Orders unavailable"
            message="Check your connection and try again."
            onRetry={() => query.refetch()}
          />
        ) : orders.length === 0 ? (
          <Card>
            <EmptyState
              icon={ClipboardList}
              title={filter === 'all' ? 'No orders yet' : 'Nothing in this stage'}
              body="New customer orders land here in real time. Pull down to refresh."
              actionLabel={filter === 'all' ? undefined : 'Show all orders'}
              onAction={filter === 'all' ? undefined : () => setFilter('all')}
            />
          </Card>
        ) : (
          <View style={styles.stack}>
            {orders.map((order) => (
              <Pressable
                key={order.id}
                onPress={() =>
                  router.push({
                    pathname: '/admin/order-detail',
                    params: { id: String(order.id) },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Open order ${order.orderNumber}`}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <Card style={styles.card}>
                  <View style={styles.topRow}>
                    <View style={styles.flex}>
                      <AppText variant="smallStrong">{order.orderNumber}</AppText>
                      <AppText variant="small" color={colors.muted}>
                        {formatDateTime(order.placedAt)} ·{' '}
                        {order.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}
                      </AppText>
                    </View>
                    <Badge
                      label={orderStatusLabel(order.status)}
                      tone={orderStatusTone(order.status)}
                    />
                  </View>

                  <View style={styles.peopleRow}>
                    <View style={styles.avatar}>
                      <AppText variant="smallStrong" color={colors.orangeDark}>
                        {order.customerName.charAt(0).toUpperCase()}
                      </AppText>
                    </View>
                    <View style={styles.flex}>
                      <AppText variant="smallStrong">{order.customerName}</AppText>
                      <AppText variant="small" color={colors.muted}>
                        {formatPhone(order.phone)}
                      </AppText>
                    </View>
                    <AppText variant="smallStrong">
                      {formatMoney(order.totalPaise)}
                    </AppText>
                    <ChevronRight size={17} strokeWidth={2.3} color={colors.muted} />
                  </View>

                  <AppText variant="small" color={colors.body}>
                    {itemSummary(order)}
                    {order.items.length > 2 ? ` + ${order.items.length - 2} more` : ''}
                  </AppText>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  chips: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
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
  pressed: {
    opacity: 0.75,
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
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
