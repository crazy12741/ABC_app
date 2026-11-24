import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '../db';
import { notificationReads, notifications } from '../schema';

export async function unreadNotificationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
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
    );

  return Number(row?.count ?? 0);
}
