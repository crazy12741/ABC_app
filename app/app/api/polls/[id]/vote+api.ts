import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { polls, pollVotes } from '@/lib/schema';
import {
  HttpError,
  errorResponse,
  readBody,
  requireSession,
} from '@/lib/server/http';
import {
  getPollsForUser,
  pollIsOpen,
  pollOptionBelongsToPoll,
} from '@/lib/server/polls';

const voteSchema = z.object({
  optionId: z.number().int().positive(),
});

export async function POST(request: Request, { id }: Record<string, string>) {
  try {
    const session = await requireSession(request);
    const pollId = Number(id);

    if (!Number.isInteger(pollId) || pollId <= 0) {
      throw new HttpError(404, 'That poll was not found.');
    }

    const body = await readBody(request, voteSchema);

    const [poll] = await db
      .select()
      .from(polls)
      .where(eq(polls.id, pollId))
      .limit(1);

    if (!poll) {
      throw new HttpError(404, 'That poll was not found.');
    }

    if (!pollIsOpen(poll.status, poll.closesAt)) {
      throw new HttpError(409, 'This poll is closed.');
    }

    const validOption = await pollOptionBelongsToPoll(pollId, body.optionId);
    if (!validOption) {
      throw new HttpError(422, 'Choose one of the listed options.');
    }

    try {
      await db.insert(pollVotes).values({
        pollId,
        optionId: body.optionId,
        userId: session.user.id,
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new HttpError(409, 'You have already voted in this poll.');
      }
      throw error;
    }

    const updated = await getPollsForUser(session.user.id);
    const view = updated.find((item) => item.id === pollId) ?? null;

    return Response.json({ poll: view });
  } catch (error) {
    return errorResponse(error);
  }
}
