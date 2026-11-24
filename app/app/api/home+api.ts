import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { user } from '@/lib/auth-schema';
import { announcements, mysteryClues } from '@/lib/schema';
import { requireSession, route } from '@/lib/server/http';
import { toProfile } from '@/lib/server/profile';
import { getSettings } from '@/lib/server/settings';
import { getPollsForUser } from '@/lib/server/polls';
import { getReferralSummary } from '@/lib/server/referrals';
import { unreadNotificationCount } from '@/lib/server/unread';
import type { HomeData } from '@/lib/types';

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

  const [settings, announcementRows, allPolls, clueRows, referral, unread] = await Promise.all([
    getSettings(),
    db
      .select()
      .from(announcements)
      .where(eq(announcements.published, true))
      .orderBy(desc(announcements.pinned), desc(announcements.publishedAt))
      .limit(4),
    getPollsForUser(userId),
    db
      .select()
      .from(mysteryClues)
      .where(eq(mysteryClues.published, true))
      .orderBy(desc(mysteryClues.publishedAt), desc(mysteryClues.clueNumber))
      .limit(1),
    getReferralSummary(userId, false),
    unreadNotificationCount(userId),
  ]);

  const latest = clueRows[0]
    ? {
        id: clueRows[0].id,
        clueNumber: clueRows[0].clueNumber,
        title: clueRows[0].title,
        body: clueRows[0].body,
        imageUrl: clueRows[0].imageUrl,
        publishedAt: clueRows[0].publishedAt ? clueRows[0].publishedAt.toISOString() : null,
      }
    : null;

  const data: HomeData = {
    profile: toProfile(profileRow),
    settings,
    announcements: announcementRows.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      pinned: row.pinned,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    })),
    polls: allPolls.filter((poll) => poll.isOpen).slice(0, 3),
    latestClue: latest,
    referral,
    unreadNotifications: unread,
  };

  return Response.json(data);
});
