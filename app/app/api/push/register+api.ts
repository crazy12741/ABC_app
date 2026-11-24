import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { user } from '@/lib/auth-schema';
import { pushTokens } from '@/lib/schema';
import { readBody, requireSession, route } from '@/lib/server/http';

const registerSchema = z.object({
  token: z.string().trim().min(10).max(300),
  platform: z.enum(['ios', 'android', 'web', 'unknown']).optional(),
});

export const POST = route(async (request) => {
  const session = await requireSession(request);
  const body = await readBody(request, registerSchema);

  await db
    .insert(pushTokens)
    .values({
      userId: session.user.id,
      token: body.token,
      platform: body.platform ?? 'unknown',
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: {
        userId: session.user.id,
        platform: body.platform ?? 'unknown',
        updatedAt: new Date(),
      },
    });

  await db
    .update(user)
    .set({ pushEnabled: true })
    .where(eq(user.id, session.user.id));

  return Response.json({ ok: true });
});
