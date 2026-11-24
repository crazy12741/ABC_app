import { desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { announcements } from '@/lib/schema';
import { readBody, requireAdmin, route } from '@/lib/server/http';
import { publishBroadcast } from '@/lib/server/notifications';
import type { AdminAnnouncement } from '@/lib/types';

const announcementSchema = z.object({
  title: z.string().trim().min(2, 'Add a title.').max(120, 'Use 120 characters or fewer.'),
  body: z.string().trim().min(2, 'Add the announcement.').max(2000, 'Use 2,000 characters or fewer.'),
  published: z.boolean().optional(),
  pinned: z.boolean().optional(),
});

function toView(row: typeof announcements.$inferSelect): AdminAnnouncement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    published: row.published,
    pinned: row.pinned,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export const GET = route(async (request) => {
  await requireAdmin(request);
  const rows = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt));
  return Response.json({ announcements: rows.map(toView) });
});

export const POST = route(async (request) => {
  const session = await requireAdmin(request);
  const body = await readBody(request, announcementSchema);
  const published = body.published ?? false;

  const [created] = await db
    .insert(announcements)
    .values({
      title: body.title,
      body: body.body,
      published,
      pinned: body.pinned ?? false,
      publishedAt: published ? new Date() : null,
      createdBy: session.user.id,
    })
    .returning();

  if (published) {
    await publishBroadcast({
      title: created.title,
      body: created.body.slice(0, 160),
      type: 'announcement',
      createdBy: session.user.id,
    });
  }

  return Response.json({ announcement: toView(created) }, { status: 201 });
});
