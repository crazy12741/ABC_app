import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { menuCategories, menuItems } from '@/lib/schema';
import { HttpError, readBody, requireAdmin, routeWithParams } from '@/lib/server/http';

const updateSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(300).nullable().optional(),
  pricePaise: z.number().int().min(100).max(1_000_000).optional(),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  isVeg: z.boolean().optional(),
  available: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const PATCH = routeWithParams(async (request, { id }: Record<string, string>) => {
  await requireAdmin(request);
  const itemId = Number(id);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new HttpError(404, 'That menu item was not found.');
  }

  const body = await readBody(request, updateSchema);
  const [existing] = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.id, itemId))
    .limit(1);

  if (!existing) {
    throw new HttpError(404, 'That menu item was not found.');
  }

  if (body.categoryId !== undefined) {
    const [category] = await db
      .select({ id: menuCategories.id })
      .from(menuCategories)
      .where(eq(menuCategories.id, body.categoryId))
      .limit(1);
    if (!category) {
      throw new HttpError(422, 'Choose an existing category.');
    }
  }

  const [updated] = await db
    .update(menuItems)
    .set({
      categoryId: body.categoryId ?? existing.categoryId,
      name: body.name ?? existing.name,
      description:
        body.description === undefined ? existing.description : body.description,
      pricePaise: body.pricePaise ?? existing.pricePaise,
      imageUrl: body.imageUrl === undefined ? existing.imageUrl : body.imageUrl,
      isVeg: body.isVeg ?? existing.isVeg,
      available: body.available ?? existing.available,
      sortOrder: body.sortOrder ?? existing.sortOrder,
    })
    .where(eq(menuItems.id, itemId))
    .returning();

  return Response.json({ item: updated });
});

export const DELETE = routeWithParams(async (request, { id }: Record<string, string>) => {
  await requireAdmin(request);
  const itemId = Number(id);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new HttpError(404, 'That menu item was not found.');
  }

  const deleted = await db
    .delete(menuItems)
    .where(eq(menuItems.id, itemId))
    .returning({ id: menuItems.id });

  if (deleted.length === 0) {
    throw new HttpError(404, 'That menu item was not found.');
  }

  return Response.json({ ok: true });
});
