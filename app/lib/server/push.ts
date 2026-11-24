import { inArray } from 'drizzle-orm';
import { db } from '../db';
import { pushTokens } from '../schema';

type PushPayload = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound: 'default';
  channelId?: string;
};

export async function sendPushToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<{ sent: number; removed: number }> {
  const unique = [...new Set(tokens.filter((token) => token.startsWith('ExponentPushToken') || token.startsWith('ExpoPushToken')))];
  if (unique.length === 0) return { sent: 0, removed: 0 };

  let sent = 0;
  const invalid: string[] = [];

  for (let index = 0; index < unique.length; index += 100) {
    const chunk = unique.slice(index, index + 100);
    const messages: PushPayload[] = chunk.map((token) => ({
      to: token,
      title,
      body,
      data,
      sound: 'default',
      channelId: 'default',
    }));

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) continue;

      const result = (await response.json()) as {
        data?: { status: string; details?: { error?: string } }[];
      };

      const tickets = result.data ?? [];
      tickets.forEach((ticket, ticketIndex) => {
        if (ticket.status === 'ok') {
          sent += 1;
        } else if (ticket.details?.error === 'DeviceNotRegistered') {
          invalid.push(chunk[ticketIndex]);
        }
      });
    } catch (error) {
      console.error('Expo push request failed', error instanceof Error ? error.message : 'unknown');
    }
  }

  if (invalid.length > 0) {
    await db.delete(pushTokens).where(inArray(pushTokens.token, invalid));
  }

  return { sent, removed: invalid.length };
}

export async function sendPushToAll(
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const tokens = await db.select({ token: pushTokens.token }).from(pushTokens);
  return sendPushToTokens(tokens.map((row) => row.token), title, body, data);
}
