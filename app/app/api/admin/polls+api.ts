import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { pollOptions, polls } from '@/lib/schema';
import { HttpError, readBody, requireAdmin, route } from '@/lib/server/http';
import { getAdminPolls } from '@/lib/server/polls';

const createSchema = z.object({
  question: z.string().trim().min(3, 'Add the poll question.').max(160, 'Use 160 characters or fewer.'),
  description: z.string().trim().max(600, 'Use 600 characters or fewer.').optional(),
  options: z
    .array(z.string().trim().min(1, 'Every option needs a label.').max(60, 'Use 60 characters or fewer.'))
    .min(2, 'Add at least two options.')
    .max(6, 'Add no more than six options.'),
  showResults: z.boolean().optional(),
  closesAt: z.string().trim().nullable().optional(),
});

export const GET = route(async (request) => {
  await requireAdmin(request);
  const pollRows = await getAdminPolls();
  return Response.json({ polls: pollRows });
});

export const POST = route(async (request) => {
  const session = await requireAdmin(request);
  const body = await readBody(request, createSchema);

  const seen = new Set<string>();
  for (const option of body.options) {
    const key = option.trim().toLowerCase();
    if (seen.has(key)) {
      throw new HttpError(422, 'Each option needs a different label.');
    }
    seen.add(key);
  }

  let closesAt: Date | null = null;
  if (body.closesAt) {
    const parsed = new Date(body.closesAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new HttpError(422, 'Enter a valid closing date.');
    }
    closesAt = parsed;
  }

  const poll = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(polls)
      .values({
        question: body.question,
        description: body.description && body.description.length > 0 ? body.description : null,
        showResults: body.showResults ?? false,
        closesAt,
        createdBy: session.user.id,
      })
      .returning();

    await tx.insert(pollOptions).values(
      body.options.map((label, index) => ({
        pollId: created.id,
        label,
        sortOrder: index,
      })),
    );

    return created;
  });

  const allPolls = await getAdminPolls();
  return Response.json(
    { poll: allPolls.find((item) => item.id === poll.id) ?? null, polls: allPolls },
    { status: 201 },
  );
});
