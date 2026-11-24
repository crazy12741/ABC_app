import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { colors } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';
import { configureNotificationHandler } from '@/lib/push-client';
import { ToastProvider } from '@/components/ToastProvider';
import { CartProvider } from '@/lib/cart';
import { AuthLoadingScreen } from '@/components/StateViews';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen may already be hidden during fast refresh.
});

configureNotificationHandler();

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 20_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const segments = useSegments();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const userId = session?.user?.id;
  const onboardingComplete = session?.user?.onboardingComplete;

  useEffect(() => {
    if (isPending) return;

    const root = segments[0];
    const inAuth = root === '(auth)';
    const inOnboarding = root === '(onboarding)';
    const browsingMenu = root === 'order';
    const signedIn = Boolean(userId);

    if (!signedIn) {
      if (!inAuth && !browsingMenu) {
        setChecked(false);
        router.replace('/(auth)/welcome');
        return;
      }
      setChecked(true);
      return;
    }

    if (!onboardingComplete) {
      if (!inOnboarding) {
        setChecked(false);
        router.replace('/(onboarding)');
        return;
      }
      setChecked(true);
      return;
    }

    if (inAuth || inOnboarding) {
      setChecked(false);
      router.replace('/(tabs)');
      return;
    }

    setChecked(true);
  }, [isPending, userId, onboardingComplete, segments, router]);

  return (
    <View style={styles.root}>
      {children}
      {isPending || !checked ? (
        <View style={StyleSheet.absoluteFill}>
          <AuthLoadingScreen />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const [queryClient] = useState(createQueryClient);
  const [fontsLoaded, fontError] = useFonts({
    Anton_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <CartProvider>
            <StatusBar style="dark" />
            <AuthGate>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.cream },
                }}
              >
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(onboarding)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="profile-edit" />
                <Stack.Screen name="order" />
                <Stack.Screen name="orders" />
                <Stack.Screen name="admin" />
                <Stack.Screen name="+not-found" />
              </Stack>
            </AuthGate>
          </CartProvider>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
});
