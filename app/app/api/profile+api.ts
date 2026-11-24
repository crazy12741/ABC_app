import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { user } from '@/lib/auth-schema';
import { pollVotes, pollOptions, polls } from '@/lib/schema';
import {
  HttpError,
  errorResponse,
  readBody,
  requireSession,
  route,
} from '@/lib/server/http';
import { toProfile } from '@/lib/server/profile';
import { getReferralSummary } from '@/lib/server/referrals';
import type { ProfileData } from '@/lib/types';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(60, 'Use 60 characters or fewer.').optional(),
  email: z.string().trim().max(200, 'Use 200 characters or fewer.').optional(),
  emailUpdates: z.boolean().optional(),
});

export const GET = route(async (request) => {
  const session = await requireSession(request);
  const userId = session.user.id;

  const [profileRow] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!profileRow) {
    return Response.json({ error: 'Your account could not be found.' }, { status: 404 });
  }

  const [historyRows, referral] = await Promise.all([
    db
      .select({
        id: pollVotes.id,
        pollId: pollVotes.pollId,
        question: polls.question,
        option: pollOptions.label,
        votedAt: pollVotes.createdAt,
      })
      .from(pollVotes)
      .innerJoin(polls, eq(pollVotes.pollId, polls.id))
      .innerJoin(pollOptions, eq(pollVotes.optionId, pollOptions.id))
      .where(eq(pollVotes.userId, userId))
      .orderBy(desc(pollVotes.createdAt))
      .limit(50),
    getReferralSummary(userId, true),
  ]);

  const data: ProfileData = {
    profile: toProfile(profileRow),
    votingHistory: historyRows.map((row) => ({
      id: row.id,
      pollId: row.pollId,
      question: row.question,
      option: row.option,
      votedAt: row.votedAt.toISOString(),
    })),
    referral,
  };

  return Response.json(data);
});

export async function PATCH(request: Request) {
  try {
    const session = await requireSession(request);
    const body = await readBody(request, updateProfileSchema);

    const [current] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!current) {
      throw new HttpError(404, 'Your account could not be found.');
    }

    const updates: Partial<typeof user.$inferInsert> = {};

    if (body.name !== undefined) {
      updates.name = body.name;
    }

    if (body.email !== undefined) {
      if (body.email.length === 0) {
        updates.email = `${(current.phoneNumber ?? current.id).replace(/\D/g, '')}@phone.americanburgerclub.invalid`;
      } else {
        if (!emailPattern.test(body.email)) {
          throw new HttpError(422, 'Enter a valid email address.');
        }
        updates.email = body.email.toLowerCase();
      }
    }

    if (body.emailUpdates !== undefined) {
      updates.emailUpdates = body.emailUpdates;
    }

    if (Object.keys(updates).length === 0) {
      throw new HttpError(422, 'Change at least one detail first.');
    }

    let updated;
    try {
      [updated] = await db
        .update(user)
        .set(updates)
        .where(eq(user.id, session.user.id))
        .returning();
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new HttpError(409, 'That email address is already in use.');
      }
      throw error;
    }

    return Response.json({ profile: toProfile(updated) });
  } catch (error) {
    return errorResponse(error);
  }
}
