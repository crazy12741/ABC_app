import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db';
import { pollOptions, polls, pollVotes } from '../schema';
import type { PollView } from '../types';

export function pollIsOpen(status: string, closesAt: Date | null): boolean {
  if (status !== 'open') return false;
  if (!closesAt) return true;
  return closesAt.getTime() > Date.now();
}

export async function getPollsForUser(userId: string): Promise<PollView[]> {
  const pollRows = await db.select().from(polls).orderBy(desc(polls.createdAt));
  if (pollRows.length === 0) return [];

  const ids = pollRows.map((poll) => poll.id);

  const [optionRows, countRows, myVotes] = await Promise.all([
    db
      .select()
      .from(pollOptions)
      .where(inArray(pollOptions.pollId, ids))
      .orderBy(asc(pollOptions.sortOrder), asc(pollOptions.id)),
    db
      .select({
        pollId: pollVotes.pollId,
        optionId: pollVotes.optionId,
        votes: sql<number>`count(*)::int`,
      })
      .from(pollVotes)
      .where(inArray(pollVotes.pollId, ids))
      .groupBy(pollVotes.pollId, pollVotes.optionId),
    db
      .select({ pollId: pollVotes.pollId, optionId: pollVotes.optionId })
      .from(pollVotes)
      .where(inArray(pollVotes.pollId, ids)),
  ]);

  const optionMap = new Map<number, { id: number; label: string }[]>();
  for (const option of optionRows) {
    const list = optionMap.get(option.pollId) ?? [];
    list.push({ id: option.id, label: option.label });
    optionMap.set(option.pollId, list);
  }

  const countMap = new Map<string, number>();
  const totalMap = new Map<number, number>();
  for (const row of countRows) {
    countMap.set(`${row.pollId}:${row.optionId}`, Number(row.votes));
    totalMap.set(row.pollId, (totalMap.get(row.pollId) ?? 0) + Number(row.votes));
  }

  const voteMap = new Map<number, number>();
  for (const vote of myVotes) {
    if (vote.pollId) voteMap.set(vote.pollId, vote.optionId);
  }

  return pollRows.map((poll) => {
    const isOpen = pollIsOpen(poll.status, poll.closesAt);
    const selectedOptionId = voteMap.get(poll.id) ?? null;
    const totalVotes = totalMap.get(poll.id) ?? 0;
    const resultsVisible = poll.showResults;

    return {
      id: poll.id,
      question: poll.question,
      description: poll.description,
      status: isOpen ? 'open' : 'closed',
      isOpen,
      showResults: poll.showResults,
      resultsVisible,
      closesAt: poll.closesAt ? poll.closesAt.toISOString() : null,
      hasVoted: selectedOptionId !== null,
      selectedOptionId,
      totalVotes: resultsVisible ? totalVotes : undefined,
      options: (optionMap.get(poll.id) ?? []).map((option) => {
        if (!resultsVisible) return { id: option.id, label: option.label };
        const votes = countMap.get(`${poll.id}:${option.id}`) ?? 0;
        return {
          id: option.id,
          label: option.label,
          votes,
          percent: totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0,
        };
      }),
    };
  });
}

export async function getAdminPolls() {
  const pollRows = await db.select().from(polls).orderBy(desc(polls.createdAt));
  if (pollRows.length === 0) return [];

  const ids = pollRows.map((poll) => poll.id);
  const [optionRows, countRows] = await Promise.all([
    db
      .select()
      .from(pollOptions)
      .where(inArray(pollOptions.pollId, ids))
      .orderBy(asc(pollOptions.sortOrder), asc(pollOptions.id)),
    db
      .select({
        optionId: pollVotes.optionId,
        votes: sql<number>`count(*)::int`,
      })
      .from(pollVotes)
      .where(inArray(pollVotes.pollId, ids))
      .groupBy(pollVotes.optionId),
  ]);

  const countMap = new Map<number, number>();
  for (const row of countRows) countMap.set(row.optionId, Number(row.votes));

  return pollRows.map((poll) => {
    const options = optionRows
      .filter((option) => option.pollId === poll.id)
      .map((option) => ({
        id: option.id,
        label: option.label,
        votes: countMap.get(option.id) ?? 0,
      }));

    return {
      id: poll.id,
      question: poll.question,
      description: poll.description,
      status: pollIsOpen(poll.status, poll.closesAt) ? 'open' : 'closed',
      showResults: poll.showResults,
      closesAt: poll.closesAt ? poll.closesAt.toISOString() : null,
      createdAt: poll.createdAt.toISOString(),
      totalVotes: options.reduce((sum, option) => sum + option.votes, 0),
      options,
    };
  });
}

export async function pollOptionBelongsToPoll(pollId: number, optionId: number) {
  const [match] = await db
    .select({ id: pollOptions.id })
    .from(pollOptions)
    .where(and(eq(pollOptions.id, optionId), eq(pollOptions.pollId, pollId)))
    .limit(1);

  return Boolean(match);
}
