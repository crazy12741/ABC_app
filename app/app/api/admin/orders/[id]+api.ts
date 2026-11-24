import { z } from 'zod';
import { HttpError, readBody, requireAdmin, routeWithParams } from '@/lib/server/http';
import { getAdminOrder, updateOrderStatus } from '@/lib/server/orders';

export const GET = routeWithParams(async (request, { id }: Record<string, string>) => {
  await requireAdmin(request);
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new HttpError(404, 'That order was not found.');
  }

  const order = await getAdminOrder(orderId);
  if (!order) {
    throw new HttpError(404, 'That order was not found.');
  }

  return Response.json({ order });
});

const updateSchema = z.object({
  status: z.enum([
    'placed',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'completed',
    'cancelled',
  ]),
});

export const PATCH = routeWithParams(async (request, { id }: Record<string, string>) => {
  await requireAdmin(request);
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new HttpError(404, 'That order was not found.');
  }

  const body = await readBody(request, updateSchema);
  const order = await updateOrderStatus(orderId, body.status);
  return Response.json({ order });
});
