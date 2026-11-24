import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./lib/auth-schema.ts', './lib/schema.ts'],
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: false,
});
