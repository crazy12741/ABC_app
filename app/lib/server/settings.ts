import { eq } from 'drizzle-orm';
import { db } from '../db';
import { appSettings } from '../schema';
import type { OrderingSettings, SettingsView } from '../types';

export function toSettingsView(row: typeof appSettings.$inferSelect | undefined): SettingsView | null {
  if (!row) return null;
  return {
    openingAt: row.openingAt ? row.openingAt.toISOString() : null,
    venue: row.venue,
    city: row.city,
    mysteryTitle: row.mysteryTitle,
    mysteryTagline: row.mysteryTagline,
    mysteryImageUrl: row.mysteryImageUrl,
    referralReward: row.referralReward,
    referralRules: row.referralRules,
    orderingEnabled: row.orderingEnabled,
    deliveryFeePaise: row.deliveryFeePaise,
    minOrderPaise: row.minOrderPaise,
    orderingNote: row.orderingNote,
  };
}

export async function getSettings(): Promise<SettingsView | null> {
  const [row] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, 1))
    .limit(1);
  return toSettingsView(row);
}

export async function getSettingsRow() {
  const [row] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, 1))
    .limit(1);
  return row;
}

export async function getOrderingSettings(): Promise<OrderingSettings> {
  const row = await getSettingsRow();
  return {
    enabled: row?.orderingEnabled ?? true,
    deliveryFeePaise: row?.deliveryFeePaise ?? 3900,
    minOrderPaise: row?.minOrderPaise ?? 19900,
    note: row?.orderingNote ?? null,
    venue: row?.venue ?? null,
    city: row?.city ?? null,
  };
}
