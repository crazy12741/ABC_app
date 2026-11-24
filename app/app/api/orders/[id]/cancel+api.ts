import { HttpError, requireSession, routeWithParams } from '@/lib/server/http';
import { cancelOrderByUser } from '@/lib/server/orders';

export const POST = routeWithParams(async (request, { id }: Record<string, string>) => {
  const session = await requireSession(request);
  const orderId = Number(id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new HttpError(404, 'That order was not found.');
  }

  const order = await cancelOrderByUser(session.user.id, orderId);
  return Response.json({ order });
});
