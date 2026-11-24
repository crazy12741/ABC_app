import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notificationReads, notifications } from '@/lib/schema';
import { requireSession, route } from '@/lib/server/http';
import { unreadNotificationCount } from '@/lib/server/unread';
import type { NotificationView } from '@/lib/types';

export const GET = route(async (request) => {
  const session = await requireSession(request);
  const userId = session.user.id;

  const rows = await db
    .select({
      id: notifications.id,
      title: notifications.title,
      body: notifications.body,
      type: notifications.type,
      createdAt: notifications.createdAt,
      readId: notificationReads.id,
    })
    .from(notifications)
    .leftJoin(
      notificationReads,
      and(
        eq(notificationReads.notificationId, notifications.id),
        eq(notificationReads.userId, userId),
      ),
    )
    .where(or(isNull(notifications.userId), eq(notifications.userId, userId)))
    .orderBy(desc(notifications.createdAt))
    .limit(40);

  const data: NotificationView[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    createdAt: row.createdAt.toISOString(),
    read: row.readId !== null,
  }));

  const unread = await unreadNotificationCount(userId);

  return Response.json({ notifications: data, unread });
});
