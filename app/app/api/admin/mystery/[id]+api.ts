import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { mysteryClues } from '@/lib/schema';
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
  imageUrl: z.string().trim().max(500).nullable().optional(),
  published: z.boolean().optional(),
});

export async function PATCH(request: Request, { id }: Record<string, string>) {
  try {
    const session = await requireAdmin(request);
    const clueId = Number(id);
    if (!Number.isInteger(clueId)) {
      throw new HttpError(404, 'That clue was not found.');
    }

    const body = await readBody(request, updateSchema);
    const [existing] = await db
      .select()
      .from(mysteryClues)
      .where(eq(mysteryClues.id, clueId))
      .limit(1);

    if (!existing) {
      throw new HttpError(404, 'That clue was not found.');
    }

    const publishingNow = body.published === true && !existing.published;

    const [updated] = await db
      .update(mysteryClues)
      .set({
        title: body.title ?? existing.title,
        body: body.body ?? existing.body,
        imageUrl:
          body.imageUrl === undefined
            ? existing.imageUrl
            : body.imageUrl && body.imageUrl.length > 0
              ? body.imageUrl
              : null,
        published: body.published ?? existing.published,
        publishedAt:
          body.published === false
            ? null
            : publishingNow
              ? new Date()
              : existing.publishedAt,
      })
      .where(eq(mysteryClues.id, clueId))
      .returning();

    if (publishingNow) {
      await publishBroadcast({
        title: `Mystery clue #${updated.clueNumber} is live`,
        body: updated.title,
        type: 'mystery',
        createdBy: session.user.id,
      });
    }

    return Response.json({
      clue: {
        id: updated.id,
        clueNumber: updated.clueNumber,
        title: updated.title,
        body: updated.body,
        imageUrl: updated.imageUrl,
        published: updated.published,
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
    const clueId = Number(id);
    if (!Number.isInteger(clueId)) {
      throw new HttpError(404, 'That clue was not found.');
    }

    const deleted = await db
      .delete(mysteryClues)
      .where(eq(mysteryClues.id, clueId))
      .returning({ id: mysteryClues.id });

    if (deleted.length === 0) {
      throw new HttpError(404, 'That clue was not found.');
    }

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
