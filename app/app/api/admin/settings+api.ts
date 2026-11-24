import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { appSettings } from '@/lib/schema';
import { HttpError, readBody, requireAdmin, route } from '@/lib/server/http';
import { getSettings, toSettingsView } from '@/lib/server/settings';

const settingsSchema = z.object({
  openingAt: z.string().trim().nullable().optional(),
  venue: z.string().trim().max(160, 'Use 160 characters or fewer.').nullable().optional(),
  city: z.string().trim().max(120, 'Use 120 characters or fewer.').nullable().optional(),
  mysteryTitle: z.string().trim().max(160).nullable().optional(),
  mysteryTagline: z.string().trim().max(300).nullable().optional(),
  mysteryImageUrl: z.string().trim().max(500).nullable().optional(),
  referralReward: z.string().trim().max(300).nullable().optional(),
  referralRules: z.string().trim().max(1500).nullable().optional(),
  orderingEnabled: z.boolean().optional(),
  deliveryFeePaise: z.number().int().min(0).max(100000).optional(),
  minOrderPaise: z.number().int().min(0).max(1000000).optional(),
  orderingNote: z.string().trim().max(500).nullable().optional(),
});

export const GET = route(async (request) => {
  await requireAdmin(request);
  const settings = await getSettings();
  return Response.json({ settings });
});

export const PUT = route(async (request) => {
  await requireAdmin(request);
  const body = await readBody(request, settingsSchema);
  const keys = Object.keys(body);

  if (keys.length === 0) {
    throw new HttpError(422, 'Change at least one setting first.');
  }

  let openingAt: Date | null | undefined;
  if (body.openingAt !== undefined) {
    if (body.openingAt === null || body.openingAt.length === 0) {
      openingAt = null;
    } else {
      const parsed = new Date(body.openingAt);
      if (Number.isNaN(parsed.getTime())) {
        throw new HttpError(422, 'Enter a valid opening date and time.');
      }
      openingAt = parsed;
    }
  }

  const clean = (value: string | null | undefined) =>
    value === undefined ? undefined : value && value.length > 0 ? value : null;

  const updates = {
    openingAt,
    venue: clean(body.venue),
    city: clean(body.city),
    mysteryTitle: clean(body.mysteryTitle),
    mysteryTagline: clean(body.mysteryTagline),
    mysteryImageUrl: clean(body.mysteryImageUrl),
    referralReward: clean(body.referralReward),
    referralRules: clean(body.referralRules),
    orderingEnabled: body.orderingEnabled,
    deliveryFeePaise: body.deliveryFeePaise,
    minOrderPaise: body.minOrderPaise,
    orderingNote: clean(body.orderingNote),
  };

  const [row] = await db
    .insert(appSettings)
    .values({
      id: 1,
      openingAt: openingAt ?? null,
      venue: body.venue ?? null,
      city: body.city ?? null,
      mysteryTitle: body.mysteryTitle ?? null,
      mysteryTagline: body.mysteryTagline ?? null,
      mysteryImageUrl: body.mysteryImageUrl ?? null,
      referralReward: body.referralReward ?? null,
      referralRules: body.referralRules ?? null,
      orderingEnabled: body.orderingEnabled ?? true,
      deliveryFeePaise: body.deliveryFeePaise ?? 3900,
      minOrderPaise: body.minOrderPaise ?? 19900,
      orderingNote: body.orderingNote ?? null,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        ...Object.fromEntries(
          Object.entries(updates).filter(([, value]) => value !== undefined),
        ),
        updatedAt: new Date(),
      },
    })
    .returning();

  return Response.json({ settings: toSettingsView(row) });
});
