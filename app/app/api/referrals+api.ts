import { requireSession, route } from '@/lib/server/http';
import { getReferralSummary } from '@/lib/server/referrals';
import type { ReferralSummary } from '@/lib/types';

export const GET = route(async (request) => {
  const session = await requireSession(request);
  const referral: ReferralSummary = await getReferralSummary(session.user.id, true);
  return Response.json(referral);
});
