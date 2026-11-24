import 'dotenv/config';
import { pool } from '../lib/db';

type Check = { label: string; ok: boolean; detail: string; required?: boolean };

async function main() {
  const checks: Check[] = [];

  const envKeys = [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
  ];

  for (const key of envKeys) {
    const value = process.env[key];
    checks.push({
      label: `env ${key}`,
      ok: Boolean(value && value.trim().length > 0),
      detail: value ? 'present' : 'missing',
    });
  }

  const adminPhones = (process.env.ADMIN_PHONES ?? '')
    .split(/[,;\s]+/)
    .filter(Boolean);
  checks.push({
    label: 'env ADMIN_PHONES',
    ok: adminPhones.length > 0,
    detail:
      adminPhones.length > 0
        ? `${adminPhones.length} configured`
        : 'not configured — set at least one admin E.164 number',
    required: false,
  });

  const tables = [
    'user',
    'session',
    'account',
    'verification',
    'app_settings',
    'announcements',
    'mystery_clues',
    'polls',
    'poll_options',
    'poll_votes',
    'referrals',
    'notifications',
    'notification_reads',
    'push_tokens',
    'otp_requests',
    'menu_categories',
    'menu_items',
    'orders',
    'order_items',
  ];

  const { rows: tableRows } = await pool.query<{ table_name: string }>(
    `select table_name from information_schema.tables where table_schema = 'public'`,
  );
  const existing = new Set(tableRows.map((row) => row.table_name));
  for (const table of tables) {
    checks.push({
      label: `table ${table}`,
      ok: existing.has(table),
      detail: existing.has(table) ? 'exists' : 'missing',
    });
  }

  if (existing.has('app_settings')) {
    const { rows } = await pool.query(
      'select opening_at, venue, city, referral_reward, ordering_enabled, delivery_fee_paise, min_order_paise from app_settings where id = 1',
    );
    checks.push({
      label: 'settings row',
      ok: rows.length === 1,
      detail: rows.length === 1 ? 'seeded' : 'missing',
    });

    const { rows: orderingColumns } = await pool.query<{ count: string }>(
      `select count(*)::text as count
         from information_schema.columns
        where table_schema = 'public'
          and table_name = 'app_settings'
          and column_name in ('ordering_enabled', 'delivery_fee_paise', 'min_order_paise', 'ordering_note')`,
    );
    checks.push({
      label: 'settings ordering columns',
      ok: Number(orderingColumns[0]?.count ?? 0) === 4,
      detail: `${orderingColumns[0]?.count ?? 0} of 4 columns`,
    });
  }

  const counts: [string, string][] = [
    ['user', 'verified customers'],
    ['announcements', 'announcements'],
    ['mystery_clues', 'mystery clues'],
    ['polls', 'polls'],
    ['poll_options', 'poll options'],
    ['referrals', 'referrals'],
    ['menu_categories', 'menu categories'],
    ['menu_items', 'menu items'],
  ];

  for (const [table, label] of counts) {
    if (!existing.has(table)) continue;
    const { rows } = await pool.query<{ count: string }>(
      `select count(*)::text as count from "${table}"`,
    );
    checks.push({
      label: `seed ${label}`,
      ok: Number(rows[0]?.count ?? 0) > 0,
      detail: `${rows[0]?.count ?? 0} rows`,
      required: table !== 'user' && table !== 'referrals',
    });
  }

  const { rows: indexRows } = await pool.query<{ indexname: string }>(
    `select indexname from pg_indexes where schemaname = 'public'`,
  );
  const indexes = new Set(indexRows.map((row) => row.indexname));
  const requiredIndexes = [
    'poll_votes_poll_user_unique',
    'referrals_referred_user_unique',
    'orders_number_unique',
  ];
  for (const index of requiredIndexes) {
    checks.push({
      label: `constraint ${index}`,
      ok: indexes.has(index),
      detail: indexes.has(index) ? 'present' : 'missing',
    });
  }

  const { rows: constraintRows } = await pool.query<{ conname: string }>(
    `select conname from pg_constraint where conname = any($1::text[])`,
    [
      [
        'menu_items_price_positive',
        'orders_total_matches',
        'order_items_quantity_range',
        'order_items_line_total_matches',
      ],
    ],
  );
  const constraintNames = new Set(constraintRows.map((row) => row.conname));
  for (const name of [
    'menu_items_price_positive',
    'orders_total_matches',
    'order_items_quantity_range',
    'order_items_line_total_matches',
  ]) {
    checks.push({
      label: `constraint ${name}`,
      ok: constraintNames.has(name),
      detail: constraintNames.has(name) ? 'present' : 'missing',
    });
  }

  const client = await pool.connect();
  try {
    await client.query('begin');
    const suffix = Date.now().toString(36);
    const userA = `verify-admin-${suffix}`;
    const userB = `verify-member-${suffix}`;
    await client.query(
      `insert into "user" (id, name, email, phone_number, onboarding_complete, referral_code)
       values ($1, 'Verify Admin', $2, '+910000000001', true, $3),
              ($4, 'Verify Member', $5, '+910000000002', true, $6)`,
      [userA, `${userA}@verify.invalid`, `VERIFY${suffix}`, userB, `${userB}@verify.invalid`, `VERIFYB${suffix}`],
    );

    const { rows: pollRows } = await client.query<{ poll_id: number; option_id: number }>(
      'select p.id as poll_id, o.id as option_id from polls p join poll_options o on o.poll_id = p.id order by p.id, o.id limit 1',
    );

    if (pollRows[0]) {
      const poll = pollRows[0];
      await client.query(
        'insert into poll_votes (poll_id, option_id, user_id) values ($1, $2, $3)',
        [poll.poll_id, poll.option_id, userA],
      );

      let duplicateVoteBlocked = false;
      await client.query('savepoint duplicate_vote');
      try {
        await client.query(
          'insert into poll_votes (poll_id, option_id, user_id) values ($1, $2, $3)',
          [poll.poll_id, poll.option_id, userA],
        );
      } catch (error) {
        duplicateVoteBlocked = (error as { code?: string }).code === '23505';
        await client.query('rollback to savepoint duplicate_vote');
      }

      checks.push({
        label: 'rule duplicate vote blocked',
        ok: duplicateVoteBlocked,
        detail: duplicateVoteBlocked
          ? 'unique (poll, user) constraint enforced'
          : 'second vote was accepted',
      });
    }

    await client.query(
      'insert into referrals (referrer_id, referred_user_id, code) values ($1, $2, $3)',
      [userA, userB, `VERIFY${suffix}`],
    );

    let duplicateReferralBlocked = false;
    await client.query('savepoint duplicate_referral');
    try {
      await client.query(
        'insert into referrals (referrer_id, referred_user_id, code) values ($1, $2, $3)',
        [userB, userB, `VERIFYB${suffix}`],
      );
    } catch (error) {
      duplicateReferralBlocked = (error as { code?: string }).code === '23505';
      await client.query('rollback to savepoint duplicate_referral');
    }

    checks.push({
      label: 'rule duplicate referral blocked',
      ok: duplicateReferralBlocked,
      detail: duplicateReferralBlocked
        ? 'unique referred-user constraint enforced'
        : 'second referral link was accepted',
    });

    const { rows: menuRows } = await client.query<{ id: number; price_paise: number }>(
      'select id, price_paise from menu_items order by id limit 1',
    );
    const menuItem = menuRows[0];

    if (menuItem) {
      const { rows: orderRows } = await client.query<{ id: number }>(
        `insert into orders
           (order_number, user_id, customer_name, phone, status, fulfilment, payment_method,
            subtotal_paise, delivery_fee_paise, total_paise)
         values ($1, $2, 'Verify Member', '+910000000002', 'placed', 'pickup', 'cash', 5000, 0, 5000)
         returning id`,
        [`VERIFY-${suffix}`, userA],
      );
      const orderId = orderRows[0]?.id;

      await client.query(
        `insert into order_items
           (order_id, menu_item_id, name_snapshot, unit_price_paise, quantity, line_total_paise)
         values ($1, $2, 'Verify item', 2500, 2, 5000)`,
        [orderId, menuItem.id],
      );

      let duplicateOrderBlocked = false;
      await client.query('savepoint duplicate_order');
      try {
        await client.query(
          `insert into orders
             (order_number, user_id, customer_name, phone, subtotal_paise, total_paise)
           values ($1, $2, 'Verify Member', '+910000000002', 5000, 5000)`,
          [`VERIFY-${suffix}`, userB],
        );
      } catch (error) {
        duplicateOrderBlocked = (error as { code?: string }).code === '23505';
        await client.query('rollback to savepoint duplicate_order');
      }

      checks.push({
        label: 'rule duplicate order number blocked',
        ok: duplicateOrderBlocked,
        detail: duplicateOrderBlocked
          ? 'unique order number constraint enforced'
          : 'second order number was accepted',
      });

      let badTotalBlocked = false;
      await client.query('savepoint bad_total');
      try {
        await client.query(
          `insert into orders
             (order_number, user_id, customer_name, phone, subtotal_paise, delivery_fee_paise, total_paise)
           values ($1, $2, 'Verify Member', '+910000000002', 5000, 0, 4000)`,
          [`VERIFY-BAD-${suffix}`, userA],
        );
      } catch (error) {
        badTotalBlocked = (error as { code?: string }).code === '23514';
        await client.query('rollback to savepoint bad_total');
      }

      checks.push({
        label: 'rule order total integrity blocked',
        ok: badTotalBlocked,
        detail: badTotalBlocked
          ? 'total must equal subtotal + delivery fee'
          : 'mismatched total was accepted',
      });

      let badLineBlocked = false;
      await client.query('savepoint bad_line');
      try {
        await client.query(
          `insert into order_items
             (order_id, menu_item_id, name_snapshot, unit_price_paise, quantity, line_total_paise)
           values ($1, $2, 'Verify item', 2500, 3, 5000)`,
          [orderId, menuItem.id],
        );
      } catch (error) {
        badLineBlocked = (error as { code?: string }).code === '23514';
        await client.query('rollback to savepoint bad_line');
      }

      checks.push({
        label: 'rule order line total integrity blocked',
        ok: badLineBlocked,
        detail: badLineBlocked
          ? 'line total must equal unit price × quantity'
          : 'mismatched line total was accepted',
      });
    }
  } catch (error) {
    checks.push({
      label: 'rule checks',
      ok: false,
      detail: error instanceof Error ? error.message : 'unexpected error',
    });
  } finally {
    await client.query('rollback').catch(() => {});
    client.release();
  }

  for (const check of checks) {
    const mark = check.ok ? 'PASS' : check.required === false ? 'WARN' : 'FAIL';
    console.log(`${mark}  ${check.label} — ${check.detail}`);
  }

  const failures = checks.filter((check) => !check.ok && check.required !== false);
  const warnings = checks.filter((check) => !check.ok && check.required === false);
  console.log(
    `\n${checks.length - failures.length - warnings.length}/${checks.length} required checks passed` +
      (warnings.length > 0 ? `, ${warnings.length} warning(s).` : '.'),
  );

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error('Verification failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
