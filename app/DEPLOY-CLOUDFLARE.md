# Deploy American Burger Club to Cloudflare (no localhost)

Run these on your own computer (needs internet). Node 20+.

## 1. Install
```bash
npm install
npx expo install expo-server
npm install -D wrangler
```

## 2. Database (Neon) – one time
Create a free project at neon.tech, copy the connection string, then:
```bash
export DATABASE_URL="postgresql://...neon.tech/...?sslmode=require"
npx drizzle-kit migrate
npx tsx lib/seed.ts          # menu, polls, announcements
```

## 3. Check before shipping
```bash
npm run typecheck
```
Fix anything it reports (send me the output and I will fix it).

## 4. Log in to Cloudflare and set secrets
```bash
npx wrangler login
npx wrangler secret put DATABASE_URL
npx wrangler secret put BETTER_AUTH_SECRET      # paste: openssl rand -base64 48
npx wrangler secret put ADMIN_PHONES            # e.g. +919876543210 (your number)
npx wrangler secret put TWILIO_ACCOUNT_SID
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_PHONE_NUMBER
```

## 5. Deploy
```bash
npm run deploy
```
Wrangler prints your live link: https://american-burger-club.<your-name>.workers.dev

## 6. Tell the login system its own address, then redeploy
```bash
npx wrangler secret put BETTER_AUTH_URL         # paste the live link from step 5
npm run deploy
```

## 7. Make yourself admin
Add your number to ADMIN_PHONES (step 4) BEFORE you first sign in. Then open the
live link, sign in with OTP, finish onboarding, and the admin shield appears.

## Custom domain (optional)
Cloudflare dashboard → Workers → american-burger-club → Settings → Domains & Routes.
Then set BETTER_AUTH_URL to that domain and redeploy.

## Important notes
- Never put .zip or .env files in /public – everything in it becomes downloadable.
- Twilio trial accounts only text verified numbers. Real customers need an upgraded
  account, and for India (+91) Twilio requires DLT registration for SMS.
- Phone-app (Android/iOS) builds use EXPO_PUBLIC_API_URL = your live link.
