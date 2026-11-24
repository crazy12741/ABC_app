import { eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { user } from '@/lib/auth-schema';
import { orders, polls, pollVotes, referrals } from '@/lib/schema';
import { ACTIVE_ORDER_STATUSES } from '@/lib/order-status';
import { requireAdmin, route } from '@/lib/server/http';
import { getAdminCustomers } from '@/lib/server/customers';
import { unreadNotificationCount } from '@/lib/server/unread';
import type { AdminOverview } from '@/lib/types';

export const GET = route(async (request) => {
  const session = await requireAdmin(request);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    customers,
    newCustomers,
    votes,
    verifiedReferrals,
    openPolls,
    recentCustomers,
    unread,
    totalOrders,
    activeOrders,
  ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(user)
        .where(eq(user.onboardingComplete, true)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(user)
        .where(gte(user.createdAt, weekAgo)),
      db.select({ count: sql<number>`count(*)::int` }).from(pollVotes),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(referrals)
        .where(eq(referrals.status, 'verified')),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(polls)
        .where(eq(polls.status, 'open')),
      getAdminCustomers('', 6),
      unreadNotificationCount(session.user.id),
      db.select({ count: sql<number>`count(*)::int` }).from(orders),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(inArray(orders.status, ACTIVE_ORDER_STATUSES)),
    ]);

  const data: AdminOverview = {
    stats: {
      customers: Number(customers[0]?.count ?? 0),
      newThisWeek: Number(newCustomers[0]?.count ?? 0),
      votes: Number(votes[0]?.count ?? 0),
      verifiedReferrals: Number(verifiedReferrals[0]?.count ?? 0),
      orders: Number(totalOrders[0]?.count ?? 0),
      activeOrders: Number(activeOrders[0]?.count ?? 0),
    },
    recentCustomers,
    openPolls: Number(openPolls[0]?.count ?? 0),
    unreadNotifications: unread,
  };

  return Response.json(data);
});
