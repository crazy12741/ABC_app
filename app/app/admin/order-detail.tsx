import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bike, Phone, Store, X } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { apiGet, apiPatch } from '@/lib/api';
import { formatDateTime, formatMoney, formatPhone } from '@/lib/format';
import {
  nextStatuses,
  orderStatusLabel,
  orderStatusMessage,
  orderStatusTone,
  paymentMethodLabel,
  type OrderStatus,
} from '@/lib/order-status';
import type { OrderView } from '@/lib/types';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { InlineMessage } from '@/components/InlineMessage';
import { ScreenSkeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { useToast } from '@/components/ToastProvider';

const ACTION_LABELS: Record<string, string> = {
  confirmed: 'Confirm order',
  preparing: 'Start preparing',
  ready: 'Mark ready',
  out_for_delivery: 'Send for delivery',
  completed: 'Mark completed',
  cancelled: 'Cancel order',
};

export default function AdminOrderDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const id = typeof params.id === 'string' ? Number(params.id) : null;
  const [busy, setBusy] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: ({ signal }) =>
      apiGet<{ order: OrderView }>(`/api/admin/orders/${id}`, signal),
    enabled: Boolean(id),
    refetchInterval: 30_000,
  });

  const order = query.data?.order;

  const moveTo = async (status: OrderStatus) => {
    if (!order) return;
    setBusy(status);
    try {
      await apiPatch(`/api/admin/orders/${order.id}`, { status });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', order.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', order.id] });
      showToast(`Order moved to ${orderStatusLabel(status).toLowerCase()}.`, 'success');
      await query.refetch();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'The order could not be updated.',
        'error',
      );
    } finally {
      setBusy(null);
    }
  };

  const actions = order ? nextStatuses(order.status, order.fulfilment) : [];

  return (
    <AdminScreen
      title={order ? order.orderNumber : 'Order'}
      subtitle="Order detail"
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      {query.isLoading ? (
        <ScreenSkeleton blocks={3} />
      ) : query.isError || !order ? (
        <ErrorState
          title="Order not found"
          message="This order could not be loaded. Pull down to try again."
          onRetry={() => query.refetch()}
        />
      ) : (
        <View style={styles.content}>
          <Card tone="charcoal" style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.flex}>
                <AppText variant="caption" color="#C9BBA9">
                  {formatDateTime(order.placedAt)}
                </AppText>
                <AppText variant="h2" color={colors.white}>
                  {orderStatusLabel(order.status)}
                </AppText>
              </View>
              <Badge
                label={order.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}
                tone="orange"
              />
            </View>
            <AppText variant="small" color="#C9BBA9">
              {orderStatusMessage(order.status, order.fulfilment)}
            </AppText>
            <View style={styles.heroMeta}>
              <View style={styles.metaItem}>
                {order.fulfilment === 'delivery' ? (
                  <Bike size={15} strokeWidth={2.2} color={colors.orange} />
                ) : (
                  <Store size={15} strokeWidth={2.2} color={colors.orange} />
                )}
                <AppText variant="small" color="#E7D9C7">
                  {order.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}
                </AppText>
              </View>
              <AppText variant="small" color="#C9BBA9">
                {paymentMethodLabel(order.paymentMethod)}
              </AppText>
            </View>
          </Card>

          <Card style={styles.section}>
            <View style={styles.sectionHead}>
              <AppText variant="h3">Customer</AppText>
              <Badge
                label={orderStatusLabel(order.status)}
                tone={orderStatusTone(order.status)}
              />
            </View>
            <View style={styles.customerRow}>
              <View style={styles.avatar}>
                <AppText variant="smallStrong" color={colors.orangeDark}>
                  {order.customerName.charAt(0).toUpperCase()}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="smallStrong">{order.customerName}</AppText>
                <View style={styles.phoneRow}>
                  <Phone size={13} strokeWidth={2.1} color={colors.muted} />
                  <AppText variant="small" color={colors.muted}>
                    {formatPhone(order.phone)}
                  </AppText>
                </View>
              </View>
            </View>
            {order.address ? (
              <View style={styles.noteBlock}>
                <AppText variant="small" color={colors.muted}>
                  Delivery address
                </AppText>
                <AppText variant="small">{order.address}</AppText>
              </View>
            ) : null}
            {order.notes ? (
              <View style={styles.noteBlock}>
                <AppText variant="small" color={colors.muted}>
                  Kitchen notes
                </AppText>
                <AppText variant="small">{order.notes}</AppText>
              </View>
            ) : null}
          </Card>

          <Card style={styles.section}>
            <AppText variant="h3">Items</AppText>
            <View style={styles.items}>
              {order.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.qty}>
                    <AppText style={styles.qtyText}>{item.quantity}×</AppText>
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="smallStrong">{item.name}</AppText>
                    <AppText variant="small" color={colors.muted}>
                      {formatMoney(item.unitPricePaise)} each
                    </AppText>
                  </View>
                  <AppText variant="smallStrong">
                    {formatMoney(item.lineTotalPaise)}
                  </AppText>
                </View>
              ))}
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <AppText variant="small" color={colors.muted}>
                Items
              </AppText>
              <AppText variant="small">{formatMoney(order.subtotalPaise)}</AppText>
            </View>
            <View style={styles.totalRow}>
              <AppText variant="small" color={colors.muted}>
                Delivery
              </AppText>
              <AppText variant="small">
                {order.deliveryFeePaise > 0
                  ? formatMoney(order.deliveryFeePaise)
                  : 'Free'}
              </AppText>
            </View>
            <View style={styles.totalRow}>
              <AppText variant="h3">Total</AppText>
              <AppText variant="h3">{formatMoney(order.totalPaise)}</AppText>
            </View>
          </Card>

          <Card style={styles.section}>
            <AppText variant="h3">Move this order</AppText>
            {actions.length === 0 ? (
              <InlineMessage
                message="This order is closed. No further status changes are possible."
                tone="info"
              />
            ) : (
              <View style={styles.actions}>
                {actions.map((status) => (
                  <Button
                    key={status}
                    label={ACTION_LABELS[status] ?? orderStatusLabel(status)}
                    icon={status === 'cancelled' ? X : undefined}
                    variant={status === 'cancelled' ? 'danger' : 'primary'}
                    onPress={() => moveTo(status)}
                    loading={busy === status}
                    loadingLabel="Updating…"
                    disabled={busy !== null}
                  />
                ))}
              </View>
            )}
            <AppText variant="small" color={colors.muted}>
              The customer sees each change instantly in the app and receives a
              notification.
            </AppText>
          </Card>

          <Card tone="cream" style={styles.metaCard}>
            <View style={styles.totalRow}>
              <AppText variant="small" color={colors.muted}>
                Order ID
              </AppText>
              <AppText variant="smallStrong">{order.orderNumber}</AppText>
            </View>
            <View style={styles.totalRow}>
              <AppText variant="small" color={colors.muted}>
                Last update
              </AppText>
              <AppText variant="small">{formatDateTime(order.updatedAt)}</AppText>
            </View>
          </Card>
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
  flex: {
    flex: 1,
  },
  hero: {
    gap: spacing.sm,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  section: {
    gap: spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  noteBlock: {
    gap: 3,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  items: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  qty: {
    minWidth: 34,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  qtyText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: colors.charcoal,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  metaCard: {
    gap: spacing.sm,
  },
});
