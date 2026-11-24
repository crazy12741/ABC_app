import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { pollOptions, pollVotes, polls } from '@/lib/schema';
import {
  HttpError,
  errorResponse,
  readBody,
  requireAdmin,
} from '@/lib/server/http';
import { getAdminPolls } from '@/lib/server/polls';

const updateSchema = z.object({
  question: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(600).nullable().optional(),
  status: z.enum(['open', 'closed']).optional(),
  showResults: z.boolean().optional(),
  closesAt: z.string().trim().nullable().optional(),
  addOption: z.string().trim().min(1, 'Add an option label.').max(60).optional(),
});

export async function PATCH(request: Request, { id }: Record<string, string>) {
  try {
    await requireAdmin(request);
    const pollId = Number(id);
    if (!Number.isInteger(pollId)) {
      throw new HttpError(404, 'That poll was not found.');
    }

    const body = await readBody(request, updateSchema);
    const [existing] = await db
      .select()
      .from(polls)
      .where(eq(polls.id, pollId))
      .limit(1);

    if (!existing) {
      throw new HttpError(404, 'That poll was not found.');
    }

    if (body.addOption) {
      const [votes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(pollVotes)
        .where(eq(pollVotes.pollId, pollId));

      if (Number(votes?.count ?? 0) > 0) {
        throw new HttpError(409, 'Options are locked after the first vote.');
      }

      const [last] = await db
        .select({ value: sql<number>`coalesce(max(${pollOptions.sortOrder}), -1)::int` })
        .from(pollOptions)
        .where(eq(pollOptions.pollId, pollId));

      await db.insert(pollOptions).values({
        pollId,
        label: body.addOption,
        sortOrder: Number(last?.value ?? -1) + 1,
      });
    }

    let closesAt = existing.closesAt;
    if (body.closesAt !== undefined) {
      if (body.closesAt === null || body.closesAt.length === 0) {
        closesAt = null;
      } else {
        const parsed = new Date(body.closesAt);
        if (Number.isNaN(parsed.getTime())) {
          throw new HttpError(422, 'Enter a valid closing date.');
        }
        closesAt = parsed;
      }
    }

    await db
      .update(polls)
      .set({
        question: body.question ?? existing.question,
        description:
          body.description === undefined ? existing.description : body.description,
        status: body.status ?? existing.status,
        showResults: body.showResults ?? existing.showResults,
        closesAt,
      })
      .where(eq(polls.id, pollId));

    const allPolls = await getAdminPolls();
    return Response.json({ polls: allPolls });
  } catch (error) {
    return errorResponse(error);
  }
}
