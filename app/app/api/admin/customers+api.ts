import { requireAdmin, queryValue, route } from '@/lib/server/http';
import { getAdminCustomers } from '@/lib/server/customers';

export const GET = route(async (request) => {
  await requireAdmin(request);
  const query = queryValue(request, 'q') ?? '';
  const customers = await getAdminCustomers(query, 60);
  return Response.json({ customers });
});
