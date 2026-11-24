import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { user } from '../auth-schema';
import { referrals } from '../schema';
import type { ReferralSummary } from '../types';
import { getSettings } from './settings';
import { displayName } from './profile';

export async function getReferralSummary(
  userId: string,
  includeHistory = true,
): Promise<ReferralSummary> {
  const [me] = await db
    .select({ code: user.referralCode })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const [countRow] = await db
    .select({
      verified: sql<number>`count(*) filter (where ${referrals.status} = 'verified')::int`,
      pending: sql<number>`count(*) filter (where ${referrals.rewardStatus} = 'pending')::int`,
    })
    .from(referrals)
    .where(eq(referrals.referrerId, userId));

  const settings = await getSettings();

  const historyRows = includeHistory
    ? await db
        .select({
          id: referrals.id,
          name: user.name,
          joinedAt: referrals.createdAt,
          status: referrals.status,
          rewardStatus: referrals.rewardStatus,
        })
        .from(referrals)
        .innerJoin(user, eq(referrals.referredUserId, user.id))
        .where(eq(referrals.referrerId, userId))
        .orderBy(desc(referrals.createdAt))
        .limit(50)
    : [];

  return {
    code: me?.code ?? null,
    verifiedCount: Number(countRow?.verified ?? 0),
    pendingRewardCount: Number(countRow?.pending ?? 0),
    reward: settings?.referralReward ?? null,
    rules: settings?.referralRules ?? null,
    history: historyRows.map((row) => ({
      id: row.id,
      name: displayName(row.name, true),
      joinedAt: row.joinedAt.toISOString(),
      status: row.status,
      rewardStatus: row.rewardStatus,
    })),
  };
}
