import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bike,
  Check,
  Megaphone,
  Phone,
  Store,
  X,
} from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { useSignedIn } from '@/hooks/useSignedIn';
import { apiGet, apiPost } from '@/lib/api';
import { confirmAction } from '@/lib/confirm';
import { formatDateTime, formatMoney, formatPhone } from '@/lib/format';
import {
  canCustomerCancel,
  fulfilmentLabel,
  orderStatusLabel,
  orderStatusMessage,
  orderStatusTone,
  paymentMethodLabel,
  progressSteps,
} from '@/lib/order-status';
import type { OrderDetailData, OrderView } from '@/lib/types';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { InlineMessage } from '@/components/InlineMessage';
import { FlowHeader } from '@/components/OrderChrome';
import { Screen } from '@/components/Screen';
import { ScreenSkeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { useToast } from '@/components/ToastProvider';

function Timeline({ order }: { order: OrderView }) {
  const steps = progressSteps(order.fulfilment);
  const currentIndex = steps.indexOf(order.status as (typeof steps)[number]);
  const cancelled = order.status === 'cancelled';

  if (cancelled) {
    return (
      <View style={styles.cancelled}>
        <View style={styles.cancelledIcon}>
          <X size={18} strokeWidth={2.4} color={colors.danger} />
        </View>
        <View style={styles.flex}>
          <AppText variant="smallStrong" color={colors.danger}>
            Order cancelled
          </AppText>
          <AppText variant="small" color={colors.muted}>
            Nothing will be charged for this order.
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.timeline}>
      {steps.map((step, index) => {
        const done = currentIndex >= 0 && index < currentIndex;
        const current = index === currentIndex;
        const reached = done || current;
        return (
          <View key={step} style={styles.step}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  reached && styles.dotReached,
                  current && styles.dotCurrent,
                ]}
              >
                {done ? (
                  <Check size={11} strokeWidth={3} color={colors.white} />
                ) : current ? (
                  <View style={styles.dotPulse} />
                ) : null}
              </View>
              {index < steps.length - 1 ? (
                <View style={[styles.line, done && styles.lineDone]} />
              ) : null}
            </View>
            <View style={styles.stepCopy}>
              <AppText
                variant={current ? 'smallStrong' : 'small'}
                color={reached ? colors.charcoal : colors.muted}
              >
                {orderStatusLabel(step)}
              </AppText>
              {current ? (
                <AppText variant="small" color={colors.muted}>
                  {orderStatusMessage(step, order.fulfilment)}
                </AppText>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; placed?: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const signedIn = useSignedIn();
  const id = typeof params.id === 'string' ? Number(params.id) : null;
  const justPlaced = params.placed === '1';
  const [cancelling, setCancelling] = useState(false);

  const query = useQuery({
    queryKey: ['orders', id],
    queryFn: ({ signal }) =>
      apiGet<OrderDetailData>(`/api/orders/${id}`, signal),
    enabled: signedIn && Boolean(id),
    refetchInterval: 30_000,
  });

  const order = query.data?.order;

  const cancel = () => {
    if (!order) return;
    confirmAction(
      'Cancel this order?',
      'The kitchen will stop preparing it. This cannot be undone.',
      'Cancel order',
      async () => {
        setCancelling(true);
        try {
          await apiPost(`/api/orders/${order.id}/cancel`);
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['orders', order.id] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
          await query.refetch();
          showToast('Order cancelled.', 'success');
        } catch (error) {
          showToast(
            error instanceof Error ? error.message : 'The order could not be cancelled.',
            'error',
          );
        } finally {
          setCancelling(false);
        }
      },
    );
  };

  return (
    <Screen
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      contentContainerStyle={styles.content}
    >
      <FlowHeader
        title="Order details"
        subtitle={order ? order.orderNumber : 'Loading order'}
      />

      {query.isLoading ? (
        <ScreenSkeleton blocks={3} />
      ) : query.isError || !order ? (
        <ErrorState
          title="Order not found"
          message="This order could not be loaded. Pull down to try again."
          onRetry={() => query.refetch()}
        />
      ) : (
        <>
          {justPlaced ? (
            <InlineMessage
              tone="success"
              message="Order placed. Keep this screen open for live kitchen updates."
            />
          ) : null}

          <Card tone="charcoal" style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.flex}>
                <AppText variant="caption" color="#C9BBA9">
                  {order.orderNumber}
                </AppText>
                <AppText variant="h2" color={colors.white}>
                  {orderStatusLabel(order.status)}
                </AppText>
              </View>
              <Badge
                label={fulfilmentLabel(order.fulfilment)}
                tone={order.fulfilment === 'delivery' ? 'orange' : 'cream'}
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
                {formatDateTime(order.placedAt)}
              </AppText>
            </View>
          </Card>

          <Card style={styles.section}>
            <View style={styles.sectionHead}>
              <Megaphone size={17} strokeWidth={2.1} color={colors.orangeDark} />
              <AppText variant="h3">Progress</AppText>
              <Badge
                label={orderStatusLabel(order.status)}
                tone={orderStatusTone(order.status)}
              />
            </View>
            <Timeline order={order} />
            <AppText variant="small" color={colors.muted}>
              This screen refreshes automatically every 30 seconds. Pull down to
              check now.
            </AppText>
          </Card>

          <Card style={styles.section}>
            <AppText variant="h3">Your order</AppText>
            <View style={styles.items}>
              {order.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <AppText variant="small" color={colors.body} style={styles.flex}>
                    {item.quantity} × {item.name}
                  </AppText>
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
            <Badge label={paymentMethodLabel(order.paymentMethod)} tone="cream" />
          </Card>

          <Card style={styles.section}>
            <AppText variant="h3">Details</AppText>
            <View style={styles.totalRow}>
              <AppText variant="small" color={colors.muted}>
                Contact
              </AppText>
              <View style={styles.contact}>
                <Phone size={14} strokeWidth={2.1} color={colors.muted} />
                <AppText variant="smallStrong">{formatPhone(order.phone)}</AppText>
              </View>
            </View>
            {order.fulfilment === 'delivery' && order.address ? (
              <View style={styles.addressBlock}>
                <AppText variant="small" color={colors.muted}>
                  Delivery address
                </AppText>
                <AppText variant="small">{order.address}</AppText>
              </View>
            ) : (
              <View style={styles.totalRow}>
                <AppText variant="small" color={colors.muted}>
                  Collection
                </AppText>
                <AppText variant="smallStrong">Club counter</AppText>
              </View>
            )}
            {order.notes ? (
              <View style={styles.addressBlock}>
                <AppText variant="small" color={colors.muted}>
                  Kitchen notes
                </AppText>
                <AppText variant="small">{order.notes}</AppText>
              </View>
            ) : null}
          </Card>

          {canCustomerCancel(order.status) ? (
            <Button
              label="Cancel this order"
              variant="danger"
              loading={cancelling}
              loadingLabel="Cancelling…"
              onPress={cancel}
            />
          ) : null}

          <Button
            label="Back to your orders"
            variant="secondary"
            onPress={() => router.push('/orders')}
          />
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
    gap: 8,
  },
  timeline: {
    gap: 0,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 48,
  },
  rail: {
    width: 22,
    alignItems: 'center',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotReached: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  dotCurrent: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
    shadowColor: colors.orange,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  dotPulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.line,
    marginVertical: 3,
    borderRadius: 1,
  },
  lineDone: {
    backgroundColor: colors.orange,
  },
  stepCopy: {
    flex: 1,
    paddingBottom: spacing.md,
    gap: 1,
  },
  cancelled: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cancelledIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(184,51,42,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  items: {
    gap: 7,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressBlock: {
    gap: 3,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
