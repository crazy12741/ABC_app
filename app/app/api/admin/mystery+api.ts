import { desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { mysteryClues } from '@/lib/schema';
import { readBody, requireAdmin, route } from '@/lib/server/http';
import { publishBroadcast } from '@/lib/server/notifications';
import type { AdminMysteryClue } from '@/lib/types';

const clueSchema = z.object({
  title: z.string().trim().min(2, 'Add a clue title.').max(120, 'Use 120 characters or fewer.'),
  body: z.string().trim().min(2, 'Add the clue.').max(2000, 'Use 2,000 characters or fewer.'),
  imageUrl: z.string().trim().max(500).optional(),
  published: z.boolean().optional(),
});

function toView(row: typeof mysteryClues.$inferSelect): AdminMysteryClue {
  return {
    id: row.id,
    clueNumber: row.clueNumber,
    title: row.title,
    body: row.body,
    imageUrl: row.imageUrl,
    published: row.published,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export const GET = route(async (request) => {
  await requireAdmin(request);
  const rows = await db
    .select()
    .from(mysteryClues)
    .orderBy(desc(mysteryClues.clueNumber));
  return Response.json({ clues: rows.map(toView) });
});

export const POST = route(async (request) => {
  const session = await requireAdmin(request);
  const body = await readBody(request, clueSchema);
  const published = body.published ?? false;

  const [next] = await db
    .select({ value: sql<number>`coalesce(max(${mysteryClues.clueNumber}), 0)::int` })
    .from(mysteryClues);

  const [created] = await db
    .insert(mysteryClues)
    .values({
      clueNumber: Number(next?.value ?? 0) + 1,
      title: body.title,
      body: body.body,
      imageUrl: body.imageUrl && body.imageUrl.length > 0 ? body.imageUrl : null,
      published,
      publishedAt: published ? new Date() : null,
      createdBy: session.user.id,
    })
    .returning();

  if (published) {
    await publishBroadcast({
      title: `Mystery clue #${created.clueNumber} is live`,
      body: created.title,
      type: 'mystery',
      createdBy: session.user.id,
    });
  }

  return Response.json({ clue: toView(created) }, { status: 201 });
});
