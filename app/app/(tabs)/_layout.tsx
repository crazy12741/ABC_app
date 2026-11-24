import { Tabs } from 'expo-router';
import { Gift, Home, Sparkles, User, Vote } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 68,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 11,
          letterSpacing: 0.1,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="mystery"
        options={{
          title: 'Mystery',
          tabBarIcon: ({ color, size }) => (
            <Sparkles color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="vote"
        options={{
          title: 'Vote',
          tabBarIcon: ({ color, size }) => (
            <Vote color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="referrals"
        options={{
          title: 'Referrals',
          tabBarIcon: ({ color, size }) => (
            <Gift color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />
    </Tabs>
  );
}
