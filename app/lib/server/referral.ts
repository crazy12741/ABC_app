import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { user } from '../auth-schema';
import { HttpError } from './http';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length = 7): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = '';
  for (const byte of bytes) {
    code += ALPHABET[byte % ALPHABET.length];
  }
  return code;
}

export function normaliseReferralCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const [existing] = await db
    .select({ referralCode: user.referralCode })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!existing) {
    throw new HttpError(401, 'Your account could not be found.');
  }

  if (existing.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomCode();
    try {
      const updated = await db
        .update(user)
        .set({ referralCode: code })
        .where(and(eq(user.id, userId), isNull(user.referralCode)))
        .returning({ referralCode: user.referralCode });

      if (updated[0]?.referralCode) return updated[0].referralCode;
    } catch (error) {
      const pgCode = (error as { code?: string }).code;
      if (pgCode !== '23505') throw error;
    }

    const [retry] = await db
      .select({ referralCode: user.referralCode })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (retry?.referralCode) return retry.referralCode;
  }

  throw new HttpError(500, 'We could not create your referral code. Please try again.');
}
