import { HttpError, requireSession, routeWithParams } from '@/lib/server/http';
import { getOrderForUser } from '@/lib/server/orders';
import type { OrderDetailData } from '@/lib/types';

export const GET = routeWithParams(async (request, { id }: Record<string, string>) => {
  const session = await requireSession(request);
  const orderId = Number(id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new HttpError(404, 'That order was not found.');
  }

  const order = await getOrderForUser(session.user.id, orderId);
  if (!order) {
    throw new HttpError(404, 'That order was not found.');
  }

  const data: OrderDetailData = { order };
  return Response.json(data);
});
