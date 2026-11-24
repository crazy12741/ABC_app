export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
];

const LABELS: Record<OrderStatus, string> = {
  placed: 'Order placed',
  confirmed: 'Confirmed',
  preparing: 'On the grill',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function orderStatusLabel(status: string): string {
  return LABELS[status as OrderStatus] ?? status;
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export type StatusTone = 'orange' | 'green' | 'charcoal' | 'danger' | 'muted' | 'cream';

export function orderStatusTone(status: string): StatusTone {
  switch (status) {
    case 'placed':
      return 'orange';
    case 'confirmed':
    case 'preparing':
      return 'orange';
    case 'ready':
      return 'green';
    case 'out_for_delivery':
      return 'charcoal';
    case 'completed':
      return 'green';
    case 'cancelled':
      return 'danger';
    default:
      return 'muted';
  }
}

export function orderStatusMessage(status: string, fulfilment: string): string {
  switch (status) {
    case 'placed':
      return 'We have your order. The kitchen will confirm it shortly.';
    case 'confirmed':
      return 'Confirmed. Your order is queued for the kitchen.';
    case 'preparing':
      return 'The kitchen is building your order now.';
    case 'ready':
      return fulfilment === 'delivery'
        ? 'Packed and waiting for the delivery rider.'
        : 'Ready for pickup at the counter.';
    case 'out_for_delivery':
      return 'Your rider is on the way.';
    case 'completed':
      return fulfilment === 'delivery'
        ? 'Delivered. Thanks for ordering with the club.'
        : 'Picked up. Thanks for ordering with the club.';
    case 'cancelled':
      return 'This order was cancelled. Nothing will be charged.';
    default:
      return 'We are updating your order.';
  }
}

export function progressSteps(fulfilment: string): OrderStatus[] {
  return fulfilment === 'delivery'
    ? ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed']
    : ['placed', 'confirmed', 'preparing', 'ready', 'completed'];
}

export function nextStatuses(status: string, fulfilment: string): OrderStatus[] {
  if (status === 'placed') return ['confirmed', 'cancelled'];
  if (status === 'confirmed') return ['preparing', 'cancelled'];
  if (status === 'preparing') return ['ready', 'cancelled'];
  if (status === 'ready') {
    return fulfilment === 'delivery'
      ? ['out_for_delivery', 'cancelled']
      : ['completed', 'cancelled'];
  }
  if (status === 'out_for_delivery') return ['completed', 'cancelled'];
  return [];
}

export function canCustomerCancel(status: string): boolean {
  return status === 'placed' || status === 'confirmed';
}

export function paymentMethodLabel(value: string): string {
  if (value === 'upi') return 'UPI on delivery';
  return 'Cash on delivery';
}

export function fulfilmentLabel(value: string): string {
  return value === 'delivery' ? 'Delivery' : 'Pickup';
}
