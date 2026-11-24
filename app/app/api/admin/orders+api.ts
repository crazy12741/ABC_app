import { isOrderStatus } from '@/lib/order-status';
import { queryValue, requireAdmin, route } from '@/lib/server/http';
import { getAdminOrders } from '@/lib/server/orders';
import type { AdminOrdersData } from '@/lib/types';

export const GET = route(async (request) => {
  await requireAdmin(request);
  const raw = queryValue(request, 'status');
  const status = raw && isOrderStatus(raw) ? raw : null;
  const orders = await getAdminOrders(status);
  const data: AdminOrdersData = { orders };
  return Response.json(data);
});
