import { desc, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { readBody, requireAdmin, route } from '@/lib/server/http';
import { publishBroadcast } from '@/lib/server/notifications';

const broadcastSchema = z.object({
  title: z.string().trim().min(2, 'Add a notification title.').max(100, 'Use 100 characters or fewer.'),
  body: z.string().trim().min(2, 'Add the notification message.').max(300, 'Use 300 characters or fewer.'),
  type: z.string().trim().max(40).optional(),
});

export const GET = route(async (request) => {
  await requireAdmin(request);
  const rows = await db
    .select()
    .from(notifications)
    .where(isNull(notifications.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(12);

  return Response.json({
    broadcasts: rows.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      type: row.type,
      createdAt: row.createdAt.toISOString(),
    })),
  });
});

export const POST = route(async (request) => {
  const session = await requireAdmin(request);
  const body = await readBody(request, broadcastSchema);

  const { notification, push } = await publishBroadcast({
    title: body.title,
    body: body.body,
    type: body.type ?? 'general',
    createdBy: session.user.id,
  });

  return Response.json({
    notification: {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt.toISOString(),
    },
    push,
  });
});
