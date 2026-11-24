import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { phoneNumber } from 'better-auth/plugins';
import { expo } from '@better-auth/expo';
import { db } from './db';
import * as authSchema from './auth-schema';
import { sendOtpSms } from './twilio';
import {
  assertOtpSendAllowed,
  OtpRateLimitError,
  recordOtpSend,
} from './server/otp-rate-limit';

const isProduction = process.env.NODE_ENV === 'production';
const appOrigin = process.env.BETTER_AUTH_URL;

export const auth = betterAuth({
  appName: 'American Burger Club',
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: appOrigin
    ? appOrigin
    : {
        allowedHosts: ['*'],
        fallback: 'http://localhost:4000',
      },
  trustedOrigins: isProduction
    ? [appOrigin ?? 'https://americanburgerclub.in', 'abc://', 'abc://*']
    : ['*', 'abc://', 'abc://*', 'exp://', 'exp://**', 'http://localhost:*'],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'customer',
        input: false,
      },
      onboardingComplete: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
      referralCode: {
        type: 'string',
        required: false,
        input: false,
        unique: true,
      },
      referredById: {
        type: 'string',
        required: false,
        input: false,
      },
      emailUpdates: {
        type: 'boolean',
        required: false,
        defaultValue: true,
        input: false,
      },
      pushEnabled: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      '/phone-number/send-otp': {
        window: 60,
        max: 5,
      },
      '/phone-number/verify': {
        window: 60,
        max: 10,
      },
    },
  },
  advanced: isProduction
    ? undefined
    : {
        defaultCookieAttributes: {
          sameSite: 'none',
          secure: true,
          partitioned: true,
        },
      },
  plugins: [
    expo(),
    phoneNumber({
      otpLength: 6,
      expiresIn: 5 * 60,
      allowedAttempts: 3,
      phoneNumberValidator: (value) => /^\+[1-9]\d{7,14}$/.test(value),
      signUpOnVerification: {
        getTempEmail: (value) =>
          `${value.replace(/\D/g, '')}@phone.americanburgerclub.invalid`,
        getTempName: () => 'Burger Club Member',
      },
      sendOTP: async ({ phoneNumber: destination, code }) => {
        try {
          await assertOtpSendAllowed(destination);
          await sendOtpSms(destination, code);
          await recordOtpSend(destination);
        } catch (error) {
          if (error instanceof OtpRateLimitError) {
            throw new APIError('TOO_MANY_REQUESTS', {
              message: error.message,
            });
          }
          console.error('OTP delivery failed', error instanceof Error ? error.message : 'unknown');
          throw new APIError('INTERNAL_SERVER_ERROR', {
            message: 'We could not send your code right now. Please try again.',
          });
        }
      },
    }),
  ],
  telemetry: { enabled: false },
});

export type Session = typeof auth.$Infer.Session;
