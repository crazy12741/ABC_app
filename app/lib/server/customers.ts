import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { db } from '../db';
import { user } from '../auth-schema';
import { pollVotes, referrals } from '../schema';
import type { AdminCustomer } from '../types';
import { isPlaceholderEmail } from './profile';

export async function getAdminCustomers(query: string, limit = 50): Promise<AdminCustomer[]> {
  const search = `%${query.trim()}%`;

  const rows = await db
    .select()
    .from(user)
    .where(
      and(
        eq(user.onboardingComplete, true),
        query.trim()
          ? or(
              ilike(user.name, search),
              ilike(user.phoneNumber, search),
              ilike(user.email, search),
            )
          : undefined,
      ),
    )
    .orderBy(desc(user.createdAt))
    .limit(Math.min(limit, 100));

  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const [referralRows, voteRows] = await Promise.all([
    db
      .select({ referrerId: referrals.referrerId, count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(inArray(referrals.referrerId, ids))
      .groupBy(referrals.referrerId),
    db
      .select({ userId: pollVotes.userId, count: sql<number>`count(*)::int` })
      .from(pollVotes)
      .where(inArray(pollVotes.userId, ids))
      .groupBy(pollVotes.userId),
  ]);

  const referralMap = new Map(referralRows.map((row) => [row.referrerId, Number(row.count)]));
  const voteMap = new Map(voteRows.map((row) => [row.userId, Number(row.count)]));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    phoneNumber: row.phoneNumber ?? '',
    email: isPlaceholderEmail(row.email) ? null : row.email,
    role: row.role ?? 'customer',
    onboardingComplete: Boolean(row.onboardingComplete),
    createdAt: row.createdAt.toISOString(),
    referralCount: referralMap.get(row.id) ?? 0,
    voteCount: voteMap.get(row.id) ?? 0,
  }));
}
