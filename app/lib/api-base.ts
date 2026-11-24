import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function resolveApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return 'http://localhost:4000';
  }

  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.replace(/^https?:\/\//, '').split('/')[0];
    const secure =
      host.includes('exp.direct') ||
      host.includes('ngrok') ||
      host.endsWith(':443');
    return `${secure ? 'https' : 'http'}://${host}`;
  }

  return 'http://localhost:4000';
}

export function isWeb(): boolean {
  return Platform.OS === 'web';
}
