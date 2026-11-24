import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { inferAdditionalFields, phoneNumberClient } from 'better-auth/client/plugins';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { resolveApiBaseUrl } from './api-base';
import type { auth } from './auth';

const plugins = [
  phoneNumberClient(),
  inferAdditionalFields<typeof auth>(),
  ...(Platform.OS === 'web'
    ? []
    : [
        expoClient({
          scheme: 'abc',
          storagePrefix: 'abc',
          storage: SecureStore,
          cookiePrefix: 'better-auth',
        }),
      ]),
];

export const authClient = createAuthClient({
  baseURL: resolveApiBaseUrl(),
  plugins,
});

export type AuthSession = typeof authClient.$Infer.Session;
