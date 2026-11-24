import { requireSession, route } from '@/lib/server/http';
import { getPollsForUser } from '@/lib/server/polls';
import type { PollsData } from '@/lib/types';

export const GET = route(async (request) => {
  const session = await requireSession(request);
  const polls = await getPollsForUser(session.user.id);
  const data: PollsData = { polls };
  return Response.json(data);
});
