import { alias } from 'drizzle-orm/pg-core';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { user } from '@/lib/auth-schema';
import { referrals } from '@/lib/schema';
import { requireAdmin, route } from '@/lib/server/http';
import type { AdminReferral } from '@/lib/types';

const referrer = alias(user, 'referrer');
const referred = alias(user, 'referred');

export const GET = route(async (request) => {
  await requireAdmin(request);

  const rows = await db
    .select({
      id: referrals.id,
      referrerName: referrer.name,
      referrerCode: referrals.code,
      referredName: referred.name,
      status: referrals.status,
      rewardStatus: referrals.rewardStatus,
      createdAt: referrals.createdAt,
    })
    .from(referrals)
    .innerJoin(referrer, eq(referrals.referrerId, referrer.id))
    .innerJoin(referred, eq(referrals.referredUserId, referred.id))
    .orderBy(desc(referrals.createdAt))
    .limit(100);

  const data: AdminReferral[] = rows.map((row) => ({
    id: row.id,
    referrerName: row.referrerName,
    referrerCode: row.referrerCode,
    referredName: row.referredName,
    status: row.status,
    rewardStatus: row.rewardStatus,
    createdAt: row.createdAt.toISOString(),
  }));

  return Response.json({ referrals: data });
});
