import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { referrals } from '@/lib/schema';
import { HttpError, errorResponse, readBody, requireAdmin } from '@/lib/server/http';

const updateSchema = z.object({
  rewardStatus: z.enum(['pending', 'rewarded', 'not_eligible']),
});

export async function PATCH(request: Request, { id }: Record<string, string>) {
  try {
    await requireAdmin(request);
    const referralId = Number(id);
    if (!Number.isInteger(referralId)) {
      throw new HttpError(404, 'That referral was not found.');
    }

    const body = await readBody(request, updateSchema);
    const updated = await db
      .update(referrals)
      .set({ rewardStatus: body.rewardStatus })
      .where(eq(referrals.id, referralId))
      .returning({ id: referrals.id, rewardStatus: referrals.rewardStatus });

    if (updated.length === 0) {
      throw new HttpError(404, 'That referral was not found.');
    }

    return Response.json({ referral: updated[0] });
  } catch (error) {
    return errorResponse(error);
  }
}
