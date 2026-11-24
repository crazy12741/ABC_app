import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { announcements } from '@/lib/schema';
import {
  HttpError,
  errorResponse,
  readBody,
  requireAdmin,
} from '@/lib/server/http';
import { publishBroadcast } from '@/lib/server/notifications';

const updateSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  body: z.string().trim().min(2).max(2000).optional(),
  published: z.boolean().optional(),
  pinned: z.boolean().optional(),
});

export async function PATCH(request: Request, { id }: Record<string, string>) {
  try {
    const session = await requireAdmin(request);
    const announcementId = Number(id);
    if (!Number.isInteger(announcementId)) {
      throw new HttpError(404, 'That announcement was not found.');
    }

    const body = await readBody(request, updateSchema);
    const [existing] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, announcementId))
      .limit(1);

    if (!existing) {
      throw new HttpError(404, 'That announcement was not found.');
    }

    const publishingNow = body.published === true && !existing.published;

    const [updated] = await db
      .update(announcements)
      .set({
        title: body.title ?? existing.title,
        body: body.body ?? existing.body,
        pinned: body.pinned ?? existing.pinned,
        published: body.published ?? existing.published,
        publishedAt:
          body.published === false
            ? null
            : publishingNow
              ? new Date()
              : existing.publishedAt,
      })
      .where(eq(announcements.id, announcementId))
      .returning();

    if (publishingNow) {
      await publishBroadcast({
        title: updated.title,
        body: updated.body.slice(0, 160),
        type: 'announcement',
        createdBy: session.user.id,
      });
    }

    return Response.json({
      announcement: {
        id: updated.id,
        title: updated.title,
        body: updated.body,
        published: updated.published,
        pinned: updated.pinned,
        publishedAt: updated.publishedAt ? updated.publishedAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { id }: Record<string, string>) {
  try {
    await requireAdmin(request);
    const announcementId = Number(id);
    if (!Number.isInteger(announcementId)) {
      throw new HttpError(404, 'That announcement was not found.');
    }

    const deleted = await db
      .delete(announcements)
      .where(eq(announcements.id, announcementId))
      .returning({ id: announcements.id });

    if (deleted.length === 0) {
      throw new HttpError(404, 'That announcement was not found.');
    }

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
