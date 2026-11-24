import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { notificationReads, notifications } from '@/lib/schema';
import { readBody, requireSession, route } from '@/lib/server/http';

const readSchema = z.object({
  id: z.number().int().positive().optional(),
  all: z.boolean().optional(),
});

export const POST = route(async (request) => {
  const session = await requireSession(request);
  const body = await readBody(request, readSchema);
  const userId = session.user.id;

  if (body.id) {
    const [notification] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.id, body.id),
          or(isNull(notifications.userId), eq(notifications.userId, userId)),
        ),
      )
      .limit(1);

    if (notification) {
      await db
        .insert(notificationReads)
        .values({ notificationId: notification.id, userId })
        .onConflictDoNothing();
    }

    return Response.json({ ok: true });
  }

  if (body.all) {
    const unread = await db
      .select({ id: notifications.id })
      .from(notifications)
      .leftJoin(
        notificationReads,
        and(
          eq(notificationReads.notificationId, notifications.id),
          eq(notificationReads.userId, userId),
        ),
      )
      .where(
        and(
          or(isNull(notifications.userId), eq(notifications.userId, userId)),
          isNull(notificationReads.id),
        ),
      )
      .limit(100);

    if (unread.length > 0) {
      await db
        .insert(notificationReads)
        .values(unread.map((row) => ({ notificationId: row.id, userId })))
        .onConflictDoNothing();
    }

    return Response.json({ ok: true, marked: unread.length });
  }

  return Response.json({ error: 'Choose which notifications to mark as read.' }, { status: 422 });
});
