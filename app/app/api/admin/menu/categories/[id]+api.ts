import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { menuCategories, menuItems } from '@/lib/schema';
import { HttpError, readBody, requireAdmin, routeWithParams } from '@/lib/server/http';

const updateSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const PATCH = routeWithParams(async (request, { id }: Record<string, string>) => {
  await requireAdmin(request);
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new HttpError(404, 'That category was not found.');
  }

  const body = await readBody(request, updateSchema);
  const [existing] = await db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.id, categoryId))
    .limit(1);

  if (!existing) {
    throw new HttpError(404, 'That category was not found.');
  }

  const [updated] = await db
    .update(menuCategories)
    .set({
      name: body.name ?? existing.name,
      active: body.active ?? existing.active,
      sortOrder: body.sortOrder ?? existing.sortOrder,
    })
    .where(eq(menuCategories.id, categoryId))
    .returning();

  return Response.json({ category: updated });
});

export const DELETE = routeWithParams(async (request, { id }: Record<string, string>) => {
  await requireAdmin(request);
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new HttpError(404, 'That category was not found.');
  }

  const [count] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(menuItems)
    .where(eq(menuItems.categoryId, categoryId));

  if (Number(count?.value ?? 0) > 0) {
    throw new HttpError(
      409,
      'Move or delete the items in this category before deleting it.',
    );
  }

  const deleted = await db
    .delete(menuCategories)
    .where(eq(menuCategories.id, categoryId))
    .returning({ id: menuCategories.id });

  if (deleted.length === 0) {
    throw new HttpError(404, 'That category was not found.');
  }

  return Response.json({ ok: true });
});
