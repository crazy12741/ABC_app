import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { user } from '@/lib/auth-schema';
import { pushTokens } from '@/lib/schema';
import { readBody, requireSession, route } from '@/lib/server/http';

const removeSchema = z.object({
  token: z.string().trim().min(10).max(300),
});

export const POST = route(async (request) => {
  const session = await requireSession(request);
  const body = await readBody(request, removeSchema);

  await db
    .delete(pushTokens)
    .where(and(eq(pushTokens.token, body.token), eq(pushTokens.userId, session.user.id)));

  const [remaining] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pushTokens)
    .where(eq(pushTokens.userId, session.user.id));

  if (Number(remaining?.count ?? 0) === 0) {
    await db
      .update(user)
      .set({ pushEnabled: false })
      .where(eq(user.id, session.user.id));
  }

  return Response.json({ ok: true });
});
