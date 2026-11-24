import { sql } from 'drizzle-orm';
import { db } from '../db';

const RESEND_SECONDS = 60;
const HOURLY_LIMIT = 5;

export class OtpRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = 'OtpRateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function assertOtpSendAllowed(phoneNumber: string): Promise<void> {
  const recent = await db.execute(sql`
    select requested_at
    from otp_requests
    where phone_number = ${phoneNumber}
      and requested_at > now() - interval '60 seconds'
    order by requested_at desc
    limit 1
  `);

  const recentRows = recent.rows as { requested_at: string | Date }[];
  if (recentRows.length > 0) {
    const last = new Date(recentRows[0].requested_at).getTime();
    const remaining = Math.max(1, RESEND_SECONDS - Math.floor((Date.now() - last) / 1000));
    throw new OtpRateLimitError(`Please wait ${remaining} seconds before requesting another code.`, remaining);
  }

  const hourly = await db.execute(sql`
    select count(*)::int as count
    from otp_requests
    where phone_number = ${phoneNumber}
      and requested_at > now() - interval '1 hour'
  `);

  const count = Number((hourly.rows[0] as { count: number } | undefined)?.count ?? 0);
  if (count >= HOURLY_LIMIT) {
    throw new OtpRateLimitError('Too many codes requested for this number. Try again in an hour.', 3600);
  }
}

export async function recordOtpSend(phoneNumber: string): Promise<void> {
  await db.execute(sql`
    insert into otp_requests (phone_number, requested_at)
    values (${phoneNumber}, now())
  `);

  await db.execute(sql`
    delete from otp_requests
    where requested_at < now() - interval '2 days'
  `);
}
