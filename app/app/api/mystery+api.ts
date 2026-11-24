import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { mysteryClues } from '@/lib/schema';
import { requireSession, route } from '@/lib/server/http';
import { getSettings } from '@/lib/server/settings';
import type { MysteryData } from '@/lib/types';

export const GET = route(async (request) => {
  await requireSession(request);

  const [settings, clues] = await Promise.all([
    getSettings(),
    db
      .select()
      .from(mysteryClues)
      .where(eq(mysteryClues.published, true))
      .orderBy(desc(mysteryClues.clueNumber)),
  ]);

  const data: MysteryData = {
    settings,
    clues: clues.map((clue) => ({
      id: clue.id,
      clueNumber: clue.clueNumber,
      title: clue.title,
      body: clue.body,
      imageUrl: clue.imageUrl,
      publishedAt: clue.publishedAt ? clue.publishedAt.toISOString() : null,
    })),
  };

  return Response.json(data);
});
