import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { menuItems, orderItems, orders, pushTokens } from '../schema';
import {
  canCustomerCancel,
  isOrderStatus,
  nextStatuses,
  orderStatusLabel,
  orderStatusMessage,
  type OrderStatus,
} from '../order-status';
import { HttpError } from './http';
import { getOrderingSettings } from './settings';
import { publishUserNotification } from './notifications';
import { sendPushToTokens } from './push';
import type { OrderLineView, OrderView } from '../types';

type OrderRow = typeof orders.$inferSelect;
type OrderItemRow = typeof orderItems.$inferSelect;

const ORDER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length: number): string {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += ORDER_CODE_ALPHABET[Math.floor(Math.random() * ORDER_CODE_ALPHABET.length)];
  }
  return code;
}

function buildOrderNumber(): string {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `ABC-${stamp}-${randomCode(4)}`;
}

function toLineView(row: OrderItemRow): OrderLineView {
  return {
    id: row.id,
    menuItemId: row.menuItemId,
    name: row.nameSnapshot,
    unitPricePaise: row.unitPricePaise,
    quantity: row.quantity,
    lineTotalPaise: row.lineTotalPaise,
  };
}

function toOrderView(row: OrderRow, items: OrderItemRow[]): OrderView {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    userId: row.userId,
    customerName: row.customerName,
    phone: row.phone,
    status: row.status,
    fulfilment: row.fulfilment,
    paymentMethod: row.paymentMethod,
    subtotalPaise: row.subtotalPaise,
    deliveryFeePaise: row.deliveryFeePaise,
    totalPaise: row.totalPaise,
    address: row.address,
    notes: row.notes,
    placedAt: row.placedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    items: items.map(toLineView),
  };
}

async function loadItems(orderIds: number[]): Promise<Map<number, OrderItemRow[]>> {
  const map = new Map<number, OrderItemRow[]>();
  if (orderIds.length === 0) return map;

  const rows = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds))
    .orderBy(orderItems.id);

  for (const row of rows) {
    const list = map.get(row.orderId) ?? [];
    list.push(row);
    map.set(row.orderId, list);
  }
  return map;
}

export async function getOrdersForUser(userId: string): Promise<OrderView[]> {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.placedAt), desc(orders.id))
    .limit(50);

  const items = await loadItems(rows.map((row) => row.id));
  return rows.map((row) => toOrderView(row, items.get(row.id) ?? []));
}

export async function getOrderForUser(
  userId: string,
  orderId: number,
): Promise<OrderView | null> {
  const [row] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);

  if (!row) return null;
  const items = await loadItems([row.id]);
  return toOrderView(row, items.get(row.id) ?? []);
}

export async function getAdminOrders(status?: string | null): Promise<OrderView[]> {
  const valid = status && isOrderStatus(status) ? status : null;
  const rows = await db
    .select()
    .from(orders)
    .where(valid ? eq(orders.status, valid) : undefined)
    .orderBy(desc(orders.placedAt), desc(orders.id))
    .limit(150);

  const items = await loadItems(rows.map((row) => row.id));
  return rows.map((row) => toOrderView(row, items.get(row.id) ?? []));
}

export async function getAdminOrder(orderId: number): Promise<OrderView | null> {
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!row) return null;
  const items = await loadItems([row.id]);
  return toOrderView(row, items.get(row.id) ?? []);
}

export type CreateOrderInput = {
  userId: string;
  customerName: string;
  phone: string;
  fulfilment: 'pickup' | 'delivery';
  paymentMethod: 'cash' | 'upi';
  address: string | null;
  notes: string | null;
  items: { menuItemId: number; quantity: number }[];
};

export async function createOrder(input: CreateOrderInput): Promise<OrderView> {
  const ordering = await getOrderingSettings();
  if (!ordering.enabled) {
    throw new HttpError(409, 'Ordering is paused right now. Please check back soon.');
  }

  if (input.items.length === 0) {
    throw new HttpError(422, 'Add at least one item to your order.');
  }

  if (input.items.length > 30) {
    throw new HttpError(422, 'That is too many different items for one order.');
  }

  const quantities = new Map<number, number>();
  for (const item of input.items) {
    if (!Number.isInteger(item.menuItemId) || item.menuItemId <= 0) {
      throw new HttpError(422, 'One of the items is invalid. Refresh the menu and try again.');
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      throw new HttpError(422, 'Each item must have a quantity between 1 and 20.');
    }
    quantities.set(
      item.menuItemId,
      (quantities.get(item.menuItemId) ?? 0) + item.quantity,
    );
  }

  for (const quantity of quantities.values()) {
    if (quantity > 20) {
      throw new HttpError(422, 'Each item must have a quantity between 1 and 20.');
    }
  }

  const ids = [...quantities.keys()];
  const rows = await db.select().from(menuItems).where(inArray(menuItems.id, ids));
  const byId = new Map(rows.map((row) => [row.id, row]));

  if (rows.length !== ids.length) {
    throw new HttpError(
      409,
      'One of those items is no longer on the menu. Refresh your cart and try again.',
    );
  }

  for (const row of rows) {
    if (!row.available) {
      throw new HttpError(409, `${row.name} is unavailable right now. Remove it to continue.`);
    }
  }

  const lines = rows.map((row) => {
    const quantity = quantities.get(row.id) ?? 0;
    return {
      menuItemId: row.id,
      nameSnapshot: row.name,
      unitPricePaise: row.pricePaise,
      quantity,
      lineTotalPaise: row.pricePaise * quantity,
    };
  });

  const subtotalPaise = lines.reduce((sum, line) => sum + line.lineTotalPaise, 0);

  if (
    input.fulfilment === 'delivery' &&
    subtotalPaise < ordering.minOrderPaise
  ) {
    throw new HttpError(
      422,
      `Delivery orders need a minimum of ₹${(ordering.minOrderPaise / 100).toFixed(0)}.`,
    );
  }

  if (input.fulfilment === 'delivery' && (!input.address || input.address.length < 10)) {
    throw new HttpError(422, 'Add a delivery address with enough detail for the rider.');
  }

  const deliveryFeePaise =
    input.fulfilment === 'delivery' ? ordering.deliveryFeePaise : 0;
  const totalPaise = subtotalPaise + deliveryFeePaise;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = buildOrderNumber();
    try {
      const created = await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(orders)
          .values({
            orderNumber,
            userId: input.userId,
            customerName: input.customerName,
            phone: input.phone,
            status: 'placed',
            fulfilment: input.fulfilment,
            paymentMethod: input.paymentMethod,
            subtotalPaise,
            deliveryFeePaise,
            totalPaise,
            address: input.fulfilment === 'delivery' ? input.address : null,
            notes: input.notes,
          })
          .returning();

        const insertedItems = await tx
          .insert(orderItems)
          .values(
            lines.map((line) => ({
              orderId: order.id,
              menuItemId: line.menuItemId,
              nameSnapshot: line.nameSnapshot,
              unitPricePaise: line.unitPricePaise,
              quantity: line.quantity,
              lineTotalPaise: line.lineTotalPaise,
            })),
          )
          .returning();

        return { order, items: insertedItems };
      });

      return toOrderView(created.order, created.items);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') continue;
      throw error;
    }
  }

  throw new HttpError(503, 'We could not create the order. Please try again.');
}

async function notifyStatusChange(order: OrderRow, status: OrderStatus) {
  try {
    const message = orderStatusMessage(status, order.fulfilment);
    await publishUserNotification({
      userId: order.userId,
      type: 'order',
      title: `${order.orderNumber} · ${orderStatusLabel(status)}`,
      body: message,
    });

    const tokens = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, order.userId));

    await sendPushToTokens(
      tokens.map((row) => row.token),
      `${order.orderNumber} · ${orderStatusLabel(status)}`,
      message,
      { orderId: order.id, type: 'order' },
    );
  } catch (error) {
    console.error(
      'Order notification failed:',
      error instanceof Error ? error.message : 'unknown',
    );
  }
}

export async function updateOrderStatus(
  orderId: number,
  next: string,
): Promise<OrderView> {
  if (!isOrderStatus(next)) {
    throw new HttpError(422, 'Choose a valid order status.');
  }

  const [existing] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!existing) {
    throw new HttpError(404, 'That order was not found.');
  }

  const allowed = nextStatuses(existing.status, existing.fulfilment);
  if (!allowed.includes(next)) {
    throw new HttpError(
      409,
      `An order marked “${orderStatusLabel(existing.status)}” cannot move to “${orderStatusLabel(next)}”.`,
    );
  }

  const [updated] = await db
    .update(orders)
    .set({ status: next, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();

  await notifyStatusChange(updated, next);

  const items = await loadItems([orderId]);
  return toOrderView(updated, items.get(orderId) ?? []);
}

export async function cancelOrderByUser(
  userId: string,
  orderId: number,
): Promise<OrderView> {
  const [existing] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);

  if (!existing) {
    throw new HttpError(404, 'That order was not found.');
  }

  if (!canCustomerCancel(existing.status)) {
    throw new HttpError(
      409,
      'This order can no longer be cancelled from the app. Please call the club.',
    );
  }

  const [updated] = await db
    .update(orders)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();

  await notifyStatusChange(updated, 'cancelled');

  const items = await loadItems([orderId]);
  return toOrderView(updated, items.get(orderId) ?? []);
}
