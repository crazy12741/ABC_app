import { db } from '../db';
import { notifications } from '../schema';
import { sendPushToAll } from './push';

export async function publishBroadcast(input: {
  title: string;
  body: string;
  type?: string;
  createdBy?: string | null;
}) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: null,
      type: input.type ?? 'general',
      title: input.title,
      body: input.body,
      createdBy: input.createdBy ?? null,
    })
    .returning();

  const push = await sendPushToAll(input.title, input.body, {
    notificationId: notification.id,
    type: input.type ?? 'general',
  });

  return { notification, push };
}

export async function publishUserNotification(input: {
  userId: string;
  title: string;
  body: string;
  type?: string;
  createdBy?: string | null;
}) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type ?? 'general',
      title: input.title,
      body: input.body,
      createdBy: input.createdBy ?? null,
    })
    .returning();

  return notification;
}
