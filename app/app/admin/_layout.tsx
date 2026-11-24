import { Redirect, Stack } from 'expo-router';
import { colors } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';
import { AuthLoadingScreen } from '@/components/StateViews';

export default function AdminLayout() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <AuthLoadingScreen message="Checking club access…" />;
  }

  if (!session?.user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (session.user.role !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
        animation: 'slide_from_right',
      }}
    />
  );
}
