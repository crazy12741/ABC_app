import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { menuCategories, menuItems } from '@/lib/schema';
import { HttpError, readBody, requireAdmin, route } from '@/lib/server/http';
import { getAdminMenu } from '@/lib/server/menu';
import { getOrderingSettings } from '@/lib/server/settings';
import type { AdminMenuData } from '@/lib/types';

const itemSchema = z.object({
  categoryId: z.number().int().positive('Choose a menu category.'),
  name: z.string().trim().min(2, 'Add an item name.').max(80, 'Use 80 characters or fewer.'),
  description: z.string().trim().max(300, 'Use 300 characters or fewer.').nullable().optional(),
  pricePaise: z
    .number()
    .int()
    .min(100, 'Price must be at least ₹1.')
    .max(1_000_000, 'Price looks too high.'),
  imageUrl: z.string().trim().max(500, 'Use 500 characters or fewer.').nullable().optional(),
  isVeg: z.boolean().optional(),
  available: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const GET = route(async (request) => {
  await requireAdmin(request);
  const [ordering, menu] = await Promise.all([getOrderingSettings(), getAdminMenu()]);
  const data: AdminMenuData = {
    ordering,
    categories: menu.categories,
    items: menu.items,
  };
  return Response.json(data);
});

export const POST = route(async (request) => {
  await requireAdmin(request);
  const body = await readBody(request, itemSchema);

  const [category] = await db
    .select({ id: menuCategories.id })
    .from(menuCategories)
    .where(eq(menuCategories.id, body.categoryId))
    .limit(1);

  if (!category) {
    throw new HttpError(422, 'Choose an existing category first.');
  }

  const [created] = await db
    .insert(menuItems)
    .values({
      categoryId: body.categoryId,
      name: body.name,
      description: body.description ?? null,
      pricePaise: body.pricePaise,
      imageUrl: body.imageUrl ?? null,
      isVeg: body.isVeg ?? false,
      available: body.available ?? true,
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();

  return Response.json({ item: created }, { status: 201 });
});
