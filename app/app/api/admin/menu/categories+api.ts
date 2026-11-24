import { z } from 'zod';
import { db } from '@/lib/db';
import { menuCategories } from '@/lib/schema';
import { readBody, requireAdmin, route } from '@/lib/server/http';

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Add a category name.').max(60, 'Use 60 characters or fewer.'),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const POST = route(async (request) => {
  await requireAdmin(request);
  const body = await readBody(request, categorySchema);

  const [created] = await db
    .insert(menuCategories)
    .values({
      name: body.name,
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();

  return Response.json({ category: created }, { status: 201 });
});
