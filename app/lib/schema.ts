import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const appSettings = pgTable('app_settings', {
  id: integer('id').primaryKey().default(1),
  openingAt: timestamp('opening_at', { withTimezone: true }),
  venue: text('venue'),
  city: text('city'),
  mysteryTitle: text('mystery_title'),
  mysteryTagline: text('mystery_tagline'),
  mysteryImageUrl: text('mystery_image_url'),
  referralReward: text('referral_reward'),
  referralRules: text('referral_rules'),
  orderingEnabled: boolean('ordering_enabled').default(true).notNull(),
  deliveryFeePaise: integer('delivery_fee_paise').default(3900).notNull(),
  minOrderPaise: integer('min_order_paise').default(19900).notNull(),
  orderingNote: text('ordering_note'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const menuCategories = pgTable(
  'menu_categories',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('menu_categories_sort_idx').on(table.sortOrder, table.id)],
);

export const menuItems = pgTable(
  'menu_items',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => menuCategories.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    description: text('description'),
    pricePaise: integer('price_paise').notNull(),
    imageUrl: text('image_url'),
    isVeg: boolean('is_veg').default(false).notNull(),
    available: boolean('available').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('menu_items_category_idx').on(table.categoryId, table.sortOrder),
    check('menu_items_price_positive', sql`${table.pricePaise} > 0`),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    orderNumber: text('order_number').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    customerName: text('customer_name').notNull(),
    phone: text('phone').notNull(),
    status: text('status').default('placed').notNull(),
    fulfilment: text('fulfilment').default('pickup').notNull(),
    paymentMethod: text('payment_method').default('cash').notNull(),
    subtotalPaise: integer('subtotal_paise').notNull(),
    deliveryFeePaise: integer('delivery_fee_paise').default(0).notNull(),
    totalPaise: integer('total_paise').notNull(),
    address: text('address'),
    notes: text('notes'),
    placedAt: timestamp('placed_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('orders_number_unique').on(table.orderNumber),
    index('orders_user_idx').on(table.userId, table.placedAt),
    index('orders_status_idx').on(table.status, table.placedAt),
    check(
      'orders_amounts_non_negative',
      sql`${table.subtotalPaise} >= 0 and ${table.deliveryFeePaise} >= 0`,
    ),
    check(
      'orders_total_matches',
      sql`${table.totalPaise} = ${table.subtotalPaise} + ${table.deliveryFeePaise}`,
    ),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    menuItemId: integer('menu_item_id').references(() => menuItems.id, {
      onDelete: 'set null',
    }),
    nameSnapshot: text('name_snapshot').notNull(),
    unitPricePaise: integer('unit_price_paise').notNull(),
    quantity: integer('quantity').notNull(),
    lineTotalPaise: integer('line_total_paise').notNull(),
  },
  (table) => [
    index('order_items_order_idx').on(table.orderId),
    check(
      'order_items_quantity_range',
      sql`${table.quantity} between 1 and 20`,
    ),
    check(
      'order_items_line_total_matches',
      sql`${table.lineTotalPaise} = ${table.unitPricePaise} * ${table.quantity}`,
    ),
  ],
);

export const announcements = pgTable(
  'announcements',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    published: boolean('published').default(false).notNull(),
    pinned: boolean('pinned').default(false).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [index('announcements_published_idx').on(table.published, table.publishedAt)],
);

export const mysteryClues = pgTable(
  'mystery_clues',
  {
    id: serial('id').primaryKey(),
    clueNumber: integer('clue_number').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    imageUrl: text('image_url'),
    published: boolean('published').default(false).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [
    uniqueIndex('mystery_clues_number_unique').on(table.clueNumber),
    index('mystery_clues_published_idx').on(table.published, table.publishedAt),
  ],
);

export const polls = pgTable(
  'polls',
  {
    id: serial('id').primaryKey(),
    question: text('question').notNull(),
    description: text('description'),
    status: text('status').default('open').notNull(),
    showResults: boolean('show_results').default(false).notNull(),
    closesAt: timestamp('closes_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [index('polls_status_idx').on(table.status, table.createdAt)],
);

export const pollOptions = pgTable(
  'poll_options',
  {
    id: serial('id').primaryKey(),
    pollId: integer('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
  },
  (table) => [index('poll_options_poll_idx').on(table.pollId)],
);

export const pollVotes = pgTable(
  'poll_votes',
  {
    id: serial('id').primaryKey(),
    pollId: integer('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' }),
    optionId: integer('option_id')
      .notNull()
      .references(() => pollOptions.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('poll_votes_poll_user_unique').on(table.pollId, table.userId),
    index('poll_votes_option_idx').on(table.optionId),
  ],
);

export const referrals = pgTable(
  'referrals',
  {
    id: serial('id').primaryKey(),
    referrerId: text('referrer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    referredUserId: text('referred_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    status: text('status').default('verified').notNull(),
    rewardStatus: text('reward_status').default('pending').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('referrals_referred_user_unique').on(table.referredUserId),
    index('referrals_referrer_idx').on(table.referrerId, table.createdAt),
  ],
);

export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    type: text('type').default('general').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [index('notifications_user_idx').on(table.userId, table.createdAt)],
);

export const notificationReads = pgTable(
  'notification_reads',
  {
    id: serial('id').primaryKey(),
    notificationId: integer('notification_id')
      .notNull()
      .references(() => notifications.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    readAt: timestamp('read_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('notification_reads_unique').on(table.notificationId, table.userId),
  ],
);

export const pushTokens = pgTable(
  'push_tokens',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    platform: text('platform').default('unknown').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('push_tokens_token_unique').on(table.token),
    index('push_tokens_user_idx').on(table.userId),
  ],
);

export const otpRequests = pgTable(
  'otp_requests',
  {
    id: serial('id').primaryKey(),
    phoneNumber: text('phone_number').notNull(),
    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('otp_requests_phone_idx').on(table.phoneNumber, table.requestedAt)],
);

export type AppSettings = typeof appSettings.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type MysteryClue = typeof mysteryClues.$inferSelect;
export type Poll = typeof polls.$inferSelect;
export type PollOption = typeof pollOptions.$inferSelect;
export type PollVote = typeof pollVotes.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type PushToken = typeof pushTokens.$inferSelect;
export type MenuCategory = typeof menuCategories.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
