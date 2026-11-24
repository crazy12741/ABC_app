import { route } from '@/lib/server/http';
import { getMenu } from '@/lib/server/menu';
import { getOrderingSettings } from '@/lib/server/settings';
import type { MenuData } from '@/lib/types';

export const GET = route(async () => {
  const [ordering, menu] = await Promise.all([getOrderingSettings(), getMenu()]);
  const data: MenuData = {
    ordering,
    categories: menu.categories,
    featured: menu.featured,
  };
  return Response.json(data);
});
