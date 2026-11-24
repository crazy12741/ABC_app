import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiPost } from './api';

const TOKEN_KEY = 'abc.pushToken';

export function configureNotificationHandler() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export type PushRegistrationResult = {
  ok: boolean;
  reason?: string;
};

export async function registerForPush(): Promise<PushRegistrationResult> {
  if (Platform.OS === 'web') {
    return {
      ok: false,
      reason: 'Push notifications are available in the iOS and Android app.',
    };
  }

  if (!Device.isDevice) {
    return {
      ok: false,
      reason: 'Push notifications need a physical device.',
    };
  }

  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }

  if (!granted) {
    return {
      ok: false,
      reason: 'Notifications were not allowed. Enable them in your phone settings.',
    };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'American Burger Club',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F47B20',
    });
  }

  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
      ?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    return {
      ok: false,
      reason: 'Add your EAS project ID to enable push notifications.',
    };
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await apiPost('/api/push/register', {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error
          ? error.message
          : 'Push notifications could not be enabled.',
    };
  }
}

export async function unregisterPush(): Promise<PushRegistrationResult> {
  if (Platform.OS === 'web') return { ok: true };

  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) return { ok: true };

  try {
    await apiPost('/api/push/unregister', { token });
    await AsyncStorage.removeItem(TOKEN_KEY);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error ? error.message : 'Push notifications could not be turned off.',
    };
  }
}
