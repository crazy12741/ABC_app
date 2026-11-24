import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  ChevronRight,
  ClipboardList,
  Gift,
  Megaphone,
  Settings as SettingsIcon,
  Sparkles,
  Users,
  UtensilsCrossed,
  Vote,
} from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { apiGet } from '@/lib/api';
import { formatPhone, relativeTime } from '@/lib/format';
import type { AdminOverview } from '@/lib/types';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/StateViews';
import { ScreenSkeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { StatTile } from '@/components/StatTile';

const links = [
  {
    href: '/admin/orders',
    title: 'Orders',
    body: 'Track and move live orders.',
    icon: ClipboardList,
  },
  {
    href: '/admin/menu',
    title: 'Menu',
    body: 'Items, prices and availability.',
    icon: UtensilsCrossed,
  },
  {
    href: '/admin/customers',
    title: 'Customers',
    body: 'Verified members and activity.',
    icon: Users,
  },
  {
    href: '/admin/announcements',
    title: 'Announcements',
    body: 'Publish opening updates.',
    icon: Megaphone,
  },
  {
    href: '/admin/mystery',
    title: 'Mystery clues',
    body: 'Draft and release clues.',
    icon: Sparkles,
  },
  {
    href: '/admin/polls',
    title: 'Polls',
    body: 'Create, close and reveal results.',
    icon: Vote,
  },
  {
    href: '/admin/referrals',
    title: 'Referrals',
    body: 'Review and mark rewards.',
    icon: Gift,
  },
  {
    href: '/admin/notifications',
    title: 'Broadcast',
    body: 'Send a push notification.',
    icon: Bell,
  },
  {
    href: '/admin/settings',
    title: 'Club settings',
    body: 'Opening date, venue and rewards.',
    icon: SettingsIcon,
  },
] as const;

export default function AdminHomeScreen() {
  const router = useRouter();
  const query = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: ({ signal }) => apiGet<AdminOverview>('/api/admin/overview', signal),
  });

  const data = query.data;

  return (
    <AdminScreen
      title="Club dashboard"
      subtitle="Admin"
      onBack={() => router.replace('/(tabs)')}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      {query.isLoading ? (
        <ScreenSkeleton />
      ) : query.isError || !data ? (
        <ErrorState
          title="Dashboard unavailable"
          message="Check your connection and try again."
          onRetry={() => query.refetch()}
        />
      ) : (
        <View style={styles.content}>
          <Card tone="charcoal" style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.flex}>
                <AppText variant="caption" color="#C9BBA9">
                  American Burger Club
                </AppText>
                <AppText variant="h2" color={colors.white}>
                  Club control room
                </AppText>
              </View>
              <Badge label="Admin" tone="orange" />
            </View>
            <AppText variant="small" color="#C9BBA9">
              Everything customers see is published from here. Menu and order
              changes go live immediately.
            </AppText>
          </Card>

          <View style={styles.statsGrid}>
            <StatTile value={String(data.stats.customers)} label="Verified members" />
            <StatTile value={String(data.stats.newThisWeek)} label="New this week" />
            <StatTile value={String(data.stats.votes)} label="Total votes" />
            <StatTile
              value={String(data.stats.verifiedReferrals)}
              label="Verified referrals"
            />
            <StatTile value={String(data.stats.orders)} label="Total orders" />
            <StatTile
              value={String(data.stats.activeOrders)}
              label="Active orders"
            />
          </View>

          <View>
            <SectionHeader title="Manage the club" />
            <View style={styles.linkGrid}>
              {links.map((item) => {
                const Icon = item.icon;
                return (
                  <Pressable
                    key={item.href}
                    onPress={() => router.push(item.href)}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    style={({ pressed }) => [
                      styles.linkCard,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.linkIcon}>
                      <Icon size={19} strokeWidth={2.1} color={colors.orangeDark} />
                    </View>
                    <AppText variant="smallStrong">{item.title}</AppText>
                    <AppText variant="small" color={colors.muted}>
                      {item.body}
                    </AppText>
                    <View style={styles.linkFoot}>
                      <AppText variant="caption" color={colors.orangeDark}>
                        Open
                      </AppText>
                      <ChevronRight
                        size={15}
                        strokeWidth={2.4}
                        color={colors.orangeDark}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <SectionHeader
              title="Newest members"
              actionLabel="All customers"
              onAction={() => router.push('/admin/customers')}
            />
            {data.recentCustomers.length === 0 ? (
              <Card>
                <AppText variant="small" color={colors.muted}>
                  No verified members yet. Customers appear here after they finish
                  onboarding.
                </AppText>
              </Card>
            ) : (
              <Card style={styles.peopleCard}>
                {data.recentCustomers.map((person, index) => (
                  <View key={person.id}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.personRow}>
                      <View style={styles.avatar}>
                        <AppText variant="smallStrong" color={colors.orangeDark}>
                          {person.name.charAt(0).toUpperCase()}
                        </AppText>
                      </View>
                      <View style={styles.flex}>
                        <AppText variant="smallStrong">{person.name}</AppText>
                        <AppText variant="small" color={colors.muted}>
                          {formatPhone(person.phoneNumber)} · {relativeTime(person.createdAt)}
                        </AppText>
                      </View>
                      <Badge
                        label={person.role === 'admin' ? 'Admin' : 'Member'}
                        tone={person.role === 'admin' ? 'orange' : 'muted'}
                      />
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </View>

          <Card tone="cream" style={styles.note}>
            <AppText variant="smallStrong">Open polls: {data.openPolls}</AppText>
            <AppText variant="small" color={colors.muted}>
              Close a poll from the Polls screen. Results stay hidden until you
              enable them.
            </AppText>
          </Card>
        </View>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  hero: {
    gap: spacing.sm,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  linkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  linkCard: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 150,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: 4,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  linkFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.75,
  },
  peopleCard: {
    paddingVertical: spacing.sm,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
  note: {
    gap: 2,
  },
});
