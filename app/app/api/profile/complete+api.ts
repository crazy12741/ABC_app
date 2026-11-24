import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { user } from '@/lib/auth-schema';
import { referrals } from '@/lib/schema';
import {
  HttpError,
  errorResponse,
  readBody,
  requireSession,
} from '@/lib/server/http';
import { ensureReferralCode, normaliseReferralCode } from '@/lib/server/referral';
import { isAdminPhone, toProfile } from '@/lib/server/profile';
import { publishUserNotification } from '@/lib/server/notifications';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const completeProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter your name.')
    .max(60, 'Use 60 characters or fewer.'),
  email: z.string().trim().max(200, 'Use 200 characters or fewer.').optional(),
  referralCode: z.string().trim().max(20).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const body = await readBody(request, completeProfileSchema);

    const email = body.email?.trim() ?? '';
    if (email.length > 0 && !emailPattern.test(email)) {
      throw new HttpError(422, 'Enter a valid email address or leave it blank.');
    }

    const submittedCode = body.referralCode ? normaliseReferralCode(body.referralCode) : '';
    const ownCode = await ensureReferralCode(session.user.id);

    const profile = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(user)
        .where(eq(user.id, session.user.id))
        .for('update')
        .limit(1);

      if (!current) {
        throw new HttpError(404, 'Your account could not be found.');
      }

      if (current.onboardingComplete) {
        return current;
      }

      let referredById = current.referredById ?? null;

      if (submittedCode) {
        if (submittedCode === ownCode) {
          throw new HttpError(422, 'You cannot use your own referral code.');
        }

        const [referrer] = await tx
          .select()
          .from(user)
          .where(
            and(
              eq(user.referralCode, submittedCode),
              eq(user.onboardingComplete, true),
            ),
          )
          .limit(1);

        if (!referrer || referrer.id === session.user.id) {
          throw new HttpError(422, 'That referral code is not valid.');
        }

        try {
          await tx.insert(referrals).values({
            referrerId: referrer.id,
            referredUserId: session.user.id,
            code: submittedCode,
            status: 'verified',
            rewardStatus: 'pending',
          });
        } catch (error) {
          if ((error as { code?: string }).code === '23505') {
            throw new HttpError(422, 'A referral is already linked to this account.');
          }
          throw error;
        }

        referredById = referrer.id;
      }

      const [updated] = await tx
        .update(user)
        .set({
          name: body.name,
          email: email.length > 0 ? email.toLowerCase() : current.email,
          onboardingComplete: true,
          referredById,
          role: isAdminPhone(current.phoneNumber) ? 'admin' : current.role ?? 'customer',
        })
        .where(eq(user.id, session.user.id))
        .returning();

      return updated;
    });

    try {
      await publishUserNotification({
        userId: session.user.id,
        type: 'welcome',
        title: 'Welcome to American Burger Club',
        body: 'Your number is verified. Mystery clues, polls and referral rewards are now open.',
      });
    } catch (error) {
      console.error('Welcome notification failed', error instanceof Error ? error.message : 'unknown');
    }

    return Response.json({ profile: toProfile(profile) });
  } catch (error) {
    return errorResponse(error);
  }
}
