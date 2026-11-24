# American Burger Club — Customer App

A premium, cross-platform (iOS / Android / web) customer app for **American Burger Club**, a burger takeaway brand in Kochi, Kerala. Built with Expo SDK 54, React Native, Expo Router and a serverless-style API in the same codebase.

**Five Tastes. One Experience.**

> The brief mentioned Thunkable. This repository is the equivalent production build in **Expo / React Native**, which supports real native apps, real SMS OTP and a real database — none of which Thunkable can provide securely.

---

## What is included

### Customer app
- **Real SMS OTP login** via Twilio (no demo codes, no bypass, server-side verification only)
  - India `+91` default with a country selector
  - 10-digit validation, separate 6-digit OTP screen
  - 60-second resend countdown, change-number option
  - Server rate limiting: 60s between sends, 5 sends/hour per number
  - Session cookie stored in SecureStore on native
- **Onboarding** after verification: name, verified mobile (prefilled), optional email, optional referral code
- **Home**: brand header, greeting, opening countdown, announcements, mystery teaser, active polls, referral card, venue/location
- **Mystery**: hero, tagline, full clue history with images and dates
- **Vote**: open/closed filters, one vote per customer per poll, duplicate prevention, results only when the admin reveals them
- **Referrals**: unique code, copy/share, verified count, pending rewards, history, rules
- **Profile**: verified number, registration date, referral code, voting history, referral summary, push/email notification settings, edit profile, sign out
- **Notifications**: in-app inbox, unread counts, mark all read
- **Food ordering**: live menu with categories, dish descriptions, veg marks and sold-out states; cart with quantity controls and local persistence; pickup or delivery checkout; cash / UPI-on-delivery payment; server-recomputed totals; order confirmation, live status timeline and order history; cancel while the order is still new

### Admin dashboard (protected)
- Role-gated at both the screen and API layers (`role === 'admin'`)
- Overview stats and newest members
- Customer directory with search
- Announcement CRUD + publish/unpublish (publishing broadcasts in-app + push)
- Mystery clue CRUD + publish/unpublish
- Poll create/edit/close/reopen, reveal/hide results, option management
- Referral review with reward status (`pending`, `rewarded`, `not_eligible`)
- Menu management: categories, items, prices, images, veg marks, availability/sold-out
- Order queue: filter by stage, inspect customer/items/notes, advance status, cancel
- Club settings: opening date/time, venue, city, mystery header, referral reward/rules, ordering on/off, delivery fee, minimum order, ordering note
- Broadcast form with push delivery feedback

### Backend
- **Neon PostgreSQL** + **Drizzle ORM**
- **Better Auth** with the phone-number plugin and Expo client
- Expo Router API routes (`app/api/**/*+api.ts`)
- Twilio REST SMS sender
- Expo push notification sender with invalid-token cleanup
- Zod validation on every write endpoint
- Ordering engine on the server: prices, line totals and delivery fees are always recomputed from the database — client totals are never trusted
- Database constraints enforced at the database level:
  - one vote per `(poll, user)`
  - one referral per referred user
  - unique referral codes, push tokens and order numbers
  - order totals must equal subtotal + delivery fee
  - order line totals must equal unit price × quantity
  - order quantities are limited to 1–20

> Per the brief, there is **no Founding 100 / membership tier programme** anywhere in the app.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Expo SDK 54, React Native 0.81, React 19, Expo Router 6 |
| Language | TypeScript (strict) |
| Data fetching | TanStack Query v5 |
| Auth | Better Auth 1.7 (phone-number OTP + Expo SecureStore) |
| Database | Neon PostgreSQL + Drizzle ORM |
| SMS | Twilio Programmable Messaging |
| Push | Expo Notifications |
| UI | Custom components, Anton + Inter fonts, lucide icons, Pexels photography |

---

## Setup

### 1. Install

```bash
bun install
```

### 2. Environment

Copy `.env.example` to `.env` and fill in:

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Long random signing secret |
| `BETTER_AUTH_URL` | Optional exact public API origin (production) |
| `ADMIN_PHONES` | Comma-separated E.164 numbers that become admins |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Sender number in E.164, or a Messaging Service SID (`MG...`) |
| `EXPO_PUBLIC_API_URL` | Optional API origin for native builds |

Generate a secret:

```bash
openssl rand -base64 48
```

### 3. Database

```bash
bun run db:migrate
bun run db:seed
```

The seed creates the club settings (opening night, venue, mystery header, referral reward/rules, ordering rules), three announcements, two mystery clues, five polls and a starter menu (Burgers, Sides, Shakes & Drinks — 10 items).

Verify the database and security constraints:

```bash
bun run db:verify
```

### 4. Run

```bash
bun run dev
```

The app is served on port `4000` with an Expo tunnel. Open it in the Ideavo preview, Expo Go, or an iOS/Android simulator.

### 5. Create your admin account

1. Add your number to `ADMIN_PHONES` in `.env` **before** you complete onboarding, e.g. `ADMIN_PHONES=+919876543210`.
2. Restart the dev server so the env is reloaded.
3. Sign in with that number and finish onboarding.
4. The profile-complete endpoint assigns `role = 'admin'`.
5. A shield button appears on Home and Profile → **Open admin dashboard**.

If the account already completed onboarding before you added the number, promote it directly:

```sql
update "user" set role = 'admin' where phone_number = '+919876543210';
```

Then sign out and back in (or refresh the app).

### Twilio trial accounts

Trial accounts can only deliver SMS to **verified destination numbers**. Add your test phone under *Phone Numbers → Verified Caller IDs* in the Twilio console, or upgrade the account before testing with real customers.

---

## Ordering

Customers order from **Home → Order now** (or the bag icon in the header). The flow is:

1. **Menu** — categories, descriptions, prices, veg marks and sold-out states.
2. **Cart** — quantity controls, persisted locally, price-synced with the live menu.
3. **Checkout** — pickup or delivery, contact number, kitchen notes, delivery address and cash / UPI-on-delivery payment.
4. **Confirmation** — order number and a live status timeline that refreshes every 30 seconds.
5. **Your orders** — history in Profile and the menu screen.

Server rules:

- Prices, line totals and the delivery fee are recomputed from the database.
- Delivery orders must meet the minimum order value set in club settings.
- Sold-out or deleted items cannot be ordered.
- Quantities are capped at 20 per item.
- Status moves only through valid stages: `placed → confirmed → preparing → ready → out_for_delivery → completed`, or `cancelled`.
- Customers can cancel only while an order is `placed` or `confirmed`.
- Every status change creates an in-app notification and pushes to the customer's devices.

Ordering can be paused from **Admin → Club settings → Online ordering** without hiding the menu.

**Payments:** this build collects payment on delivery (cash or UPI). No online payment gateway is connected, so no card data is handled.

---

## API routes

All customer routes require a valid session. All `/api/admin/*` routes additionally require `role === 'admin'`.

### Auth
| Route | Purpose |
| --- | --- |
| `/api/auth/*` | Better Auth (send OTP, verify OTP, session, sign out) |

### Customer
| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/home` | Profile, settings, announcements, polls, latest clue, referral, unread count |
| GET | `/api/mystery` | Settings + published clues |
| GET | `/api/polls` | Polls for the signed-in customer |
| POST | `/api/polls/[id]/vote` | Cast one vote (`optionId`) |
| GET / PATCH | `/api/profile` | Profile + voting history; update name/email/email prefs |
| POST | `/api/profile/complete` | Finish registration and create referral code |
| GET | `/api/referrals` | Referral summary + history |
| GET | `/api/notifications` | Notification inbox |
| POST | `/api/notifications/read` | Mark one (`id`) or all (`all: true`) read |
| POST | `/api/push/register` | Register an Expo push token |
| POST | `/api/push/unregister` | Remove a push token |
| GET | `/api/menu` | Public menu — categories, items, featured dishes and ordering rules |
| GET / POST | `/api/orders` | Order history / place an order (`items`, `fulfilment`, `paymentMethod`, `phone`, `address`, `notes`) |
| GET | `/api/orders/[id]` | One order owned by the signed-in customer |
| POST | `/api/orders/[id]/cancel` | Cancel while the order is `placed` or `confirmed` |

### Admin
| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/admin/overview` | Dashboard stats |
| GET | `/api/admin/customers?q=` | Customer directory |
| GET / POST | `/api/admin/announcements` | List / create announcements |
| PATCH / DELETE | `/api/admin/announcements/[id]` | Update, publish, delete |
| GET / POST | `/api/admin/mystery` | List / create clues |
| PATCH / DELETE | `/api/admin/mystery/[id]` | Update, publish, delete |
| GET / POST | `/api/admin/polls` | List / create polls |
| PATCH | `/api/admin/polls/[id]` | Edit, close/reopen, reveal results, add option |
| GET | `/api/admin/referrals` | Referral review list |
| PATCH | `/api/admin/referrals/[id]` | Set reward status |
| GET / PUT | `/api/admin/settings` | Club settings, including ordering rules |
| GET / POST | `/api/admin/notifications` | Recent broadcasts / send broadcast |
| GET / POST | `/api/admin/menu` | Menu overview / create item |
| PATCH / DELETE | `/api/admin/menu/[id]` | Edit item, toggle availability, delete |
| POST | `/api/admin/menu/categories` | Create a category |
| PATCH / DELETE | `/api/admin/menu/categories/[id]` | Rename/hide or delete an empty category |
| GET | `/api/admin/orders?status=` | Order queue, optionally filtered by stage |
| GET / PATCH | `/api/admin/orders/[id]` | Order detail / advance or cancel the order |

---

## Verification

Run everything:

```bash
bun run verify:all
```

or individually:

```bash
bun run typecheck      # TypeScript strict check
bun run db:verify      # schema, seed, env and DB rule checks
bun run verify:guards  # every protected API route rejects unauthenticated calls
bun run verify:orders  # end-to-end order creation, pricing, permissions and status flow
```

### Automated results (last run)

| Check | Result |
| --- | --- |
| `bun run typecheck` | Pass (0 errors) |
| `bun run db:verify` | 44/47 required checks passed; 3 warnings |
| `bun run verify:guards` | 39/39 protected routes returned `401` (menu is public) |
| `bun run verify:orders` | Order totals, ownership, delivery minimum and status transitions verified |
| Duplicate vote | Blocked by `poll_votes_poll_user_unique` |
| Duplicate referral link | Blocked by `referrals_referred_user_unique` |
| Duplicate order number | Blocked by `orders_number_unique` |
| Order total / line total mismatches | Blocked by database check constraints |
| Tables + settings + seeded content | Present, including 3 menu categories and 10 items |

Warnings are expected on a fresh database:
- `ADMIN_PHONES` is not configured yet.
- There are no customers or referrals until real people sign in.

### Manual test checklist (requires a real phone)

These flows need a handset and a Twilio-verified destination number:

- [ ] New registration: enter number → receive real SMS → verify → onboarding
- [ ] Incorrect OTP is rejected and cleared
- [ ] Expired OTP (> 5 minutes) is rejected
- [ ] Resend is disabled for 60 seconds and then works
- [ ] Existing customer signs in without re-registering
- [ ] Logout → login again with a fresh OTP
- [ ] Duplicate vote is blocked in the UI and by the API
- [ ] Referral code: self-referral rejected; valid code links the referrer
- [ ] Customer cannot open `/admin` or call `/api/admin/*`
- [ ] Admin publishes an announcement → appears on Home + notification arrives
- [ ] Admin publishes a clue → Mystery tab updates + notification arrives
- [ ] Admin reveals poll results → percentages appear for customers
- [ ] Push token registration on a physical device with an EAS project ID
- [ ] Menu loads with categories and sold-out items cannot be added
- [ ] Cart quantity controls, persistence after reload and clear cart
- [ ] Pickup order places successfully with cash on delivery
- [ ] Delivery order below the minimum is blocked with a clear message
- [ ] Delivery order above the minimum adds the correct delivery fee
- [ ] Order status advances: placed → confirmed → preparing → ready → completed
- [ ] Customer sees each status change and notification
- [ ] Customer can cancel a new order; the kitchen cannot move a closed order
- [ ] Admin can pause ordering and customers cannot place orders
- [ ] One customer cannot read or cancel another customer's order

---

## Publishing

### Prerequisites
1. Install the EAS CLI: `bun add -g eas-cli` or `npm i -g eas-cli`.
2. Log in: `eas login`.
3. Link the project: `eas init` — this writes `extra.eas.projectId` into `app.json`. Push notifications require this ID.

### Native API URL
Native builds do not share the web origin. Set the public API origin before building:

```bash
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
```

Deploy the Expo Router API (the same `app/api/**` routes) to a Node host or EAS Hosting, connect the Neon database, and set the same environment variables there. Set `BETTER_AUTH_URL` to that public origin so cookies and trusted origins are correct.

### Android
```bash
eas build --platform android --profile production
eas submit --platform android --profile production
```
- `android.package` is `com.americanburgerclub.app`.
- Upload/keep your keystore with EAS.

### iOS
```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production
```
- `ios.bundleIdentifier` is `com.americanburgerclub.app`.
- Provide an Apple Developer account and App Store Connect app record.
- Add a push notification key in EAS credentials.

### Web
```bash
bun run build:web
```
The app uses `"web": { "output": "server" }` so API routes are included. Deploy the output to a Node-compatible host, or use EAS Hosting.

---

## Security notes

- Twilio credentials and the database URL live only on the server; they are never shipped to the client.
- OTP verification happens inside Better Auth on the server. The client never sees or validates the code itself.
- Sessions are signed, httpOnly cookies. Native clients store them in SecureStore.
- All admin routes re-check the session role on the server; hiding buttons is never the only protection.
- Every write endpoint validates its body with Zod.
- Database constraints prevent duplicate votes, duplicate referral links and mismatched order totals even under concurrent requests.
- Order prices come from the database at checkout. A tampered client payload cannot change the amount charged.
- Order reads and cancellations are scoped to the signed-in customer; admins use separately guarded routes.
- Payments are collected on delivery (cash or UPI). No card data ever enters the app.
- Rate limits apply to OTP sends and verification attempts.
- Placeholder emails used for phone-only accounts end in `@phone.americanburgerclub.invalid` and are never shown to customers.

---

## Project structure

```
app/
  (auth)/            welcome, phone, verify
  (onboarding)/      profile completion
  (tabs)/            home, mystery, vote, referrals, profile
  order/             menu, cart, checkout
  orders.tsx         order history
  orders/[id].tsx    live status timeline
  admin/             protected dashboard, editors, menu and order queue
  api/               Expo Router API routes
  _layout.tsx        fonts, providers, session gate
components/          design system and shared UI
constants/           theme, photo URLs
hooks/               countdown, vote, signed-in helper
lib/
  auth.ts            Better Auth server config
  auth-client.ts     Better Auth client
  schema.ts          app tables
  auth-schema.ts     Better Auth tables
  server/            API helpers (auth, polls, referrals, push, …)
  seed.ts            seed data
scripts/             verification scripts
drizzle/             generated migrations
```
